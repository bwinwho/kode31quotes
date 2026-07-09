// quotes.js — the in-progress quote draft (customer, selected services, pricing),
// the shared service-selection card used by both Universe and MultiVerse, the
// customer + review page views, and all Firestore CRUD for saved quotes.

import { db, COLLECTIONS, stripUndefined, nowMs } from './firebase.js';
import {
  el, card, tileIcon, glowIcon, icon, button, iconButton, textInput, textareaInput,
  checkRow, switchToggle, badge, formatINR, formatDate, generateQuoteNumber, uid,
} from './ui.js';
import { getCurrentProfile } from './auth.js';
import { getCompanySettings } from './settings.js';
import { generateQuotePdf } from './pdf.js';

/* ============================== Draft state ============================== */

let draft = emptyDraft();

function emptyDraft() {
  return {
    division: null,
    categoryPath: [],
    customer: null,
    items: [],
    discount: { type: 'flat', value: 0 },
    gstEnabled: false,
    gstRate: 18,
    paymentTerms: '',
    validityDays: 15,
    notes: '',
    editingId: null, // set when editing a previously-saved quote
    quoteNumber: null,
    createdAt: null,
  };
}

export function resetDraft() {
  draft = emptyDraft();
}

export function getDraft() {
  return draft;
}

export function setDivision(division) {
  draft.division = division;
}

export function setCustomer(customer) {
  draft.customer = customer;
}

export function setCategoryPath(path) {
  draft.categoryPath = path;
}

/* ---- Line items ---- */

function computeUnitPrice(service, quantity) {
  if (service.bundlePricing?.enabled && quantity >= service.bundlePricing.minUnits) {
    return service.bundlePricing.unitPrice;
  }
  return service.startingPrice;
}

function computeLineTotal(item) {
  const upgradeTotal = item.selectedUpgrades.reduce((s, u) => s + u.price, 0);
  return item.unitPrice * item.quantity + upgradeTotal;
}

export function hasItem(serviceId) {
  return draft.items.some((i) => i.serviceId === serviceId);
}

export function getItem(serviceId) {
  return draft.items.find((i) => i.serviceId === serviceId);
}

export function addService(service, categoryName, businessTypeName) {
  if (hasItem(service.id)) return;
  const quantity = service.bundlePricing?.enabled ? service.bundlePricing.minUnits : 1;
  const item = {
    serviceId: service.id,
    name: service.name,
    categoryName,
    businessTypeName: businessTypeName || undefined,
    priceType: service.priceType,
    unitPrice: computeUnitPrice(service, quantity),
    quantity,
    includes: service.includes || [],
    selectedUpgrades: [],
    annualCharges: (service.annualCharges || []).map((c) => ({ id: c.id, name: c.name, price: c.price, included: c.defaultIncluded })),
    deliveryTime: service.deliveryTime || undefined,
    bundleLabel: service.bundlePricing?.enabled ? service.bundlePricing.minUnitsLabel : undefined,
    _bundlePricing: service.bundlePricing || null,
    _startingPrice: service.startingPrice,
  };
  item.lineTotal = computeLineTotal(item);
  draft.items.push(item);
}

export function removeItem(serviceId) {
  draft.items = draft.items.filter((i) => i.serviceId !== serviceId);
}

export function setQuantity(serviceId, quantity) {
  const item = getItem(serviceId);
  if (!item) return;
  item.quantity = Math.max(1, quantity);
  if (item._bundlePricing?.enabled) {
    item.unitPrice = item.quantity >= item._bundlePricing.minUnits ? item._bundlePricing.unitPrice : item._startingPrice;
  }
  item.lineTotal = computeLineTotal(item);
}

export function toggleUpgrade(serviceId, upgrade) {
  const item = getItem(serviceId);
  if (!item) return;
  const exists = item.selectedUpgrades.some((u) => u.id === upgrade.id);
  item.selectedUpgrades = exists ? item.selectedUpgrades.filter((u) => u.id !== upgrade.id) : [...item.selectedUpgrades, upgrade];
  item.lineTotal = computeLineTotal(item);
}

export function toggleAnnualCharge(serviceId, chargeId) {
  const item = getItem(serviceId);
  if (!item) return;
  item.annualCharges = item.annualCharges.map((c) => (c.id === chargeId ? { ...c, included: !c.included } : c));
}

export function setDiscount(type, value) {
  draft.discount = { type, value };
}

export function setGst(enabled, rate) {
  draft.gstEnabled = enabled;
  if (rate !== undefined) draft.gstRate = rate;
}

export function setPaymentTerms(v) {
  draft.paymentTerms = v;
}

export function setValidityDays(v) {
  draft.validityDays = v;
}

export function setNotes(v) {
  draft.notes = v;
}

/* ---- Totals ---- */

export function computeSubtotal() {
  return draft.items.reduce((s, i) => s + i.lineTotal, 0);
}

export function computeAnnualTotal() {
  return draft.items.reduce((s, i) => s + i.annualCharges.filter((c) => c.included).reduce((cs, c) => cs + c.price, 0), 0);
}

export function computeDiscountAmount() {
  const subtotal = computeSubtotal();
  if (draft.discount.type === 'percent') return Math.round((subtotal * draft.discount.value) / 100);
  return Math.min(draft.discount.value, subtotal);
}

export function computeGstAmount() {
  if (!draft.gstEnabled) return 0;
  const taxable = computeSubtotal() - computeDiscountAmount() + computeAnnualTotal();
  return Math.round((taxable * draft.gstRate) / 100);
}

export function computeGrandTotal() {
  return computeSubtotal() - computeDiscountAmount() + computeAnnualTotal() + computeGstAmount();
}

/* ============================== Firestore CRUD ============================== */

export function buildQuoteRecord(companySettings) {
  const subtotal = computeSubtotal();
  const discountAmount = computeDiscountAmount();
  const annualTotal = computeAnnualTotal();
  const gstAmount = computeGstAmount();
  const items = draft.items.map((i) => ({
    serviceId: i.serviceId,
    name: i.name,
    categoryName: i.categoryName,
    businessTypeName: i.businessTypeName,
    priceType: i.priceType,
    unitPrice: i.unitPrice,
    quantity: i.quantity,
    lineTotal: i.lineTotal,
    includes: i.includes,
    selectedUpgrades: i.selectedUpgrades,
    annualCharges: i.annualCharges,
    deliveryTime: i.deliveryTime,
    bundleLabel: i.bundleLabel,
  }));
  const profile = getCurrentProfile();
  return {
    id: draft.editingId || uid(),
    quoteNumber: draft.quoteNumber || generateQuoteNumber(),
    divisionId: draft.division?.id,
    divisionName: draft.division?.name,
    customer: draft.customer,
    items,
    subtotal,
    discount: { ...draft.discount, amount: discountAmount },
    annualTotal,
    gst: { enabled: draft.gstEnabled, rate: draft.gstRate, amount: gstAmount },
    total: subtotal - discountAmount + annualTotal + gstAmount,
    status: draft.status || 'Draft',
    paymentTerms: draft.paymentTerms || companySettings?.paymentTermsDefault || '50% advance, balance on delivery.',
    validityDays: draft.validityDays || companySettings?.validityDaysDefault || 15,
    notes: draft.notes,
    createdBy: { uid: profile?.uid || '', name: profile?.name || 'Team Member' },
    createdAt: draft.createdAt || nowMs(),
    updatedAt: nowMs(),
  };
}

export async function saveDraftAsQuote(companySettings) {
  const record = stripUndefined(buildQuoteRecord(companySettings));
  await db.collection(COLLECTIONS.quotes).doc(record.id).set(record);
  draft.editingId = record.id;
  draft.quoteNumber = record.quoteNumber;
  draft.createdAt = record.createdAt;
  return record;
}

export async function updateQuoteStatus(id, status) {
  await db.collection(COLLECTIONS.quotes).doc(id).update({ status, updatedAt: nowMs() });
}

export function listenQuotes(cb) {
  return db
    .collection(COLLECTIONS.quotes)
    .orderBy('createdAt', 'desc')
    .onSnapshot((snap) => cb(snap.docs.map((d) => d.data())));
}

export async function getQuoteById(id) {
  const snap = await db.collection(COLLECTIONS.quotes).doc(id).get();
  return snap.exists ? snap.data() : null;
}

export async function deleteQuote(id) {
  await db.collection(COLLECTIONS.quotes).doc(id).delete();
}

export async function duplicateQuote(quote) {
  const copy = {
    ...quote,
    id: uid(),
    quoteNumber: generateQuoteNumber(),
    status: 'Draft',
    createdAt: nowMs(),
    updatedAt: nowMs(),
  };
  await db.collection(COLLECTIONS.quotes).doc(copy.id).set(stripUndefined(copy));
  return copy;
}

/** Loads a saved quote back into the working draft so it can be edited and re-saved. */
export function loadQuoteIntoDraft(quote) {
  draft = {
    division: { id: quote.divisionId, name: quote.divisionName },
    categoryPath: [],
    customer: quote.customer,
    items: quote.items.map((i) => ({ ...i, _bundlePricing: null, _startingPrice: i.unitPrice })),
    discount: { type: quote.discount.type, value: quote.discount.value },
    gstEnabled: quote.gst.enabled,
    gstRate: quote.gst.rate,
    paymentTerms: quote.paymentTerms,
    validityDays: quote.validityDays,
    notes: quote.notes || '',
    editingId: quote.id,
    quoteNumber: quote.quoteNumber,
    createdAt: quote.createdAt,
    status: quote.status,
  };
}

/* ============================== Shared service card ============================== */

/**
 * Renders a selectable service card (used identically by Universe services, MultiVerse
 * modules, websites, social media, etc.) with includes, optional upgrades, annual charges,
 * and bundle-quantity stepper. `onChange` is called after any state mutation so the caller
 * can re-render dependents (e.g. the floating quote bar).
 */
/** Heuristic icon for a service based on its name / category (services don't store an icon). */
function deriveServiceIcon(service, categoryName) {
  const n = `${service.name} ${categoryName || ''}`.toLowerCase();
  const rules = [
    [/qr/, 'grid'],
    [/menu/, 'fileText'],
    [/web ?site|landing|portfolio|blog/, 'globe'],
    [/app|mobile/, 'smartphone'],
    [/order|store|ecommerce|delivery|shop/, 'package'],
    [/book|schedul|calendar/, 'calendar'],
    [/loyal|reward|member/, 'sparkle'],
    [/feedback|review|survey/, 'checkCircle'],
    [/dashboard|staff|admin|crm/, 'grid'],
    [/song|music|anthem|jingle|theme|track/, 'music'],
    [/podcast|audio|sound|voice|mix/, 'zap'],
    [/logo|brand|identity/, 'tag'],
    [/design|graphic|ui|ux|template|packag|print|deck/, 'palette'],
    [/automat|workflow|integrat|chatbot|whatsapp/, 'zap'],
    [/post|story|reel|content|social|video/, 'sparkle'],
    [/custom/, 'grid'],
  ];
  for (const [re, ic] of rules) if (re.test(n)) return ic;
  return 'sparkle';
}

export function renderServiceCard(service, categoryName, businessTypeName, onChange) {
  let expanded = false;
  const container = el('div', {});

  function paint() {
    container.innerHTML = '';
    container.appendChild(build());
  }

  function build() {
    const added = hasItem(service.id);
    const item = getItem(service.id);
    const svcIcon = deriveServiceIcon(service, categoryName);

    const toggleAdd = () => {
      if (added) {
        removeItem(service.id);
      } else {
        addService(service, categoryName, businessTypeName);
      }
      if (onChange) onChange();
      paint();
    };

    const head = el('div', { class: 'svc-head' }, [
      el('button', { class: 'svc-main', type: 'button', onClick: () => { expanded = !expanded; paint(); } }, [
        glowIcon(svcIcon, 24),
        el('div', { class: 'svc-info' }, [
          el('div', { class: 'svc-title-row' }, [
            el('h3', { class: 'svc-title' }, service.name),
            service.bundlePricing?.enabled ? badge('Bundle', 'warning') : null,
          ]),
          service.priceType !== 'fixed' ? el('p', { class: 'svc-from' }, 'Starting from') : null,
          el('p', { class: 'svc-price' }, formatINR(service.startingPrice)),
          service.deliveryTime
            ? el('p', { class: 'svc-delivery' }, [icon('clock', 13), `Delivery: ${service.deliveryTime}`])
            : null,
        ]),
      ]),
      el('button', { class: `svc-add${added ? ' is-added' : ''}`, type: 'button', 'aria-label': added ? 'Remove' : 'Add', onClick: (e) => { e.stopPropagation(); toggleAdd(); } }, [
        el('span', { class: 'svc-add-circle' }, [icon(added ? 'check' : 'plus', 20)]),
        el('span', { class: 'svc-add-label' }, added ? 'Added' : 'Add'),
      ]),
    ]);

    const bodyParts = [];

    if (service.description) bodyParts.push(el('p', { class: 'text-secondary text-body' }, service.description));

    if (service.includes?.length) {
      bodyParts.push(
        el('div', {}, [
          el('p', { class: 'text-eyebrow', style: { marginBottom: '10px' } }, "What's Included"),
          el(
            'div',
            { class: 'service-chip-row' },
            service.includes.map((inc) => el('span', { class: 'service-chip' }, [icon('check', 12), inc])),
          ),
        ]),
      );
    }

    if (added && item && service.bundlePricing?.enabled) {
      const qtyRow = el('div', { style: { marginTop: '16px' } }, [
        el('p', { class: 'text-eyebrow', style: { marginBottom: '10px' } }, `Quantity (${service.bundlePricing.unitLabel}s)`),
        el('div', { class: 'row', style: { gap: '12px', flexWrap: 'wrap' } }, [
          buildQtyStepper(item.quantity, (v) => { setQuantity(service.id, v); if (onChange) onChange(); paint(); }),
          item.quantity >= service.bundlePricing.minUnits
            ? el('span', { class: 'badge badge-success' }, `Bundle rate — ${formatINR(service.bundlePricing.unitPrice)}/${service.bundlePricing.unitLabel}`)
            : el('span', { class: 'text-caption' }, `${service.bundlePricing.minUnitsLabel} for bundle rate`),
        ]),
      ]);
      bodyParts.push(qtyRow);
    }

    if (service.optionalUpgrades?.length) {
      bodyParts.push(
        el('div', { style: { marginTop: '16px' } }, [
          el('p', { class: 'text-eyebrow', style: { marginBottom: '10px' } }, 'Optional Enhancements'),
          el(
            'div',
            { class: 'grid-2' },
            service.optionalUpgrades.map((upg) =>
              checkRow({
                label: upg.name,
                price: `+${formatINR(upg.price)}`,
                checked: !!item?.selectedUpgrades.some((u) => u.id === upg.id),
                disabled: !added,
                onChange: () => {
                  if (!added) addService(service, categoryName, businessTypeName);
                  toggleUpgrade(service.id, upg);
                  if (onChange) onChange();
                  paint();
                },
              }),
            ),
          ),
        ]),
      );
    }

    if (service.annualCharges?.length) {
      bodyParts.push(
        el('div', { style: { marginTop: '16px' } }, [
          el('p', { class: 'text-eyebrow', style: { marginBottom: '10px' } }, 'Optional Yearly Charges'),
          el(
            'div',
            { class: 'grid-2' },
            service.annualCharges.map((chg) =>
              checkRow({
                label: chg.name,
                price: `${formatINR(chg.price)}/yr`,
                checked: !!item?.annualCharges.find((c) => c.id === chg.id)?.included,
                disabled: !added,
                onChange: () => { toggleAnnualCharge(service.id, chg.id); if (onChange) onChange(); paint(); },
              }),
            ),
          ),
        ]),
      );
    }

    if (!added && bodyParts.length) {
      bodyParts.push(button({ label: 'Add to Quote', icon: 'plus', full: true, onClick: toggleAdd, size: 'lg' }));
    }

    const wrap = el('div', { class: `svc-card${added ? ' is-added' : ''}` });
    wrap.appendChild(head);
    if (expanded && bodyParts.length) wrap.appendChild(el('div', { class: 'svc-body animate-fade-in' }, bodyParts));
    return wrap;
  }

  paint();
  return container;
}

function buildQtyStepper(value, onChange) {
  return el('div', { class: 'qty-stepper' }, [
    el('button', { type: 'button', onClick: () => onChange(Math.max(1, value - 1)) }, '−'),
    el('span', {}, String(value)),
    el('button', { type: 'button', onClick: () => onChange(value + 1) }, '+'),
  ]);
}

/* ============================== Floating quote bar ============================== */

export function renderQuoteBar(navigate) {
  if (draft.items.length === 0) return null;
  const total = computeGrandTotal();
  const count = draft.items.length;
  return el('div', {}, [
    // Occupies real layout space so the page can scroll its last items clear of the fixed bar below.
    el('div', { class: 'quote-bar-spacer' }),
    el('div', { class: 'quote-bar animate-fade-up' }, [
      el('div', { class: 'quote-bar-inner' }, [
        el('span', { class: 'qbar-bag' }, [icon('bag', 20)]),
        el('div', { class: 'qbar-text' }, [
          el('p', { class: 'qbar-count' }, `${count} service${count > 1 ? 's' : ''} selected`),
          el('p', { class: 'qbar-total' }, formatINR(total)),
        ]),
        button({ label: 'Review Quote', icon: 'arrowRight', onClick: () => navigate('/quote') }),
      ]),
    ]),
  ]);
}

/* ============================== Customer view ============================== */

export function renderCustomerView(navigate) {
  if (!draft.division) {
    navigate('/');
    return el('div');
  }
  let name = draft.customer?.name || '';
  let phone = draft.customer?.phone || '';
  let company = draft.customer?.company || '';

  const view = el('div', { class: 'flow-page animate-fade-up' });
  view.appendChild(flowTop(() => navigate(-1), 1, 3));
  view.appendChild(
    el('div', { class: 'flow-head' }, [
      el('h1', { class: 'text-display-sm' }, 'Customer Details'),
      el('p', { class: 'flow-sub text-secondary' }, "Let's get to know your customer."),
    ]),
  );

  const iconField = (iconName, label, optional, inputEl) =>
    el('div', { class: 'icon-field' }, [
      el('div', { class: 'icon-field-icon' }, [icon(iconName, 20)]),
      el('div', { class: 'icon-field-body' }, [
        el('label', { class: 'icon-field-label' }, [label, optional ? el('span', { class: 'icon-field-optional' }, ' (optional)') : null]),
        inputEl,
      ]),
    ]);

  const nameInput = el('input', { class: 'input', value: name, placeholder: 'e.g. Aditi Sharma', required: true, oninput: (e) => (name = e.target.value) });
  const phoneInput = el('input', { class: 'input', type: 'tel', value: phone, placeholder: 'e.g. 98765 43210', required: true, oninput: (e) => (phone = e.target.value) });
  const companyInput = el('input', { class: 'input', value: company, placeholder: 'e.g. Studio Nine', oninput: (e) => (company = e.target.value) });

  const form = el('form', { class: 'card customer-card' }, [
    iconField('user', 'Customer Name', false, nameInput),
    iconField('phone', 'Phone Number', false, phoneInput),
    iconField('building', 'Company', true, companyInput),
    button({ label: 'Continue', icon: 'arrowRight', size: 'lg', full: true, type: 'submit' }),
  ]);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    setCustomer({ name: name.trim(), phone: phone.trim(), company: company.trim() || undefined });
    navigate(draft.division.id === 'universe' ? '/universe' : '/multiverse');
  });

  view.appendChild(form);
  return view;
}

/** Just a circular back button in its own row — for flows without a step indicator. */
export function flowBack(onBack) {
  return el('div', { class: 'flow-back' }, [iconButton({ iconName: 'arrowLeft', variant: 'secondary', onClick: onBack, ariaLabel: 'Back' })]);
}

/** Fixed-flow header: circular back button on the left, centered step indicator. */
export function flowTop(onBack, step, total) {
  const dots = el('div', { class: 'step-dots' });
  for (let i = 1; i <= total; i++) {
    dots.appendChild(el('span', { class: `step-dot${i <= step ? ' is-done' : ''}${i === step ? ' is-current' : ''}` }));
    if (i < total) dots.appendChild(el('span', { class: `step-line${i < step ? ' is-done' : ''}` }));
  }
  return el('div', { class: 'flow-top' }, [
    onBack ? iconButton({ iconName: 'arrowLeft', variant: 'secondary', onClick: onBack, ariaLabel: 'Back' }) : el('span'),
    el('div', { class: 'step-indicator' }, [dots, step ? el('p', { class: 'step-label' }, `STEP ${step} OF ${total}`) : null]),
    el('span', { class: 'flow-top-spacer' }),
  ]);
}

export function pageHeader(title, subtitle, onBack, action) {
  return el('div', { class: 'row', style: { gap: '12px', marginBottom: '20px' } }, [
    onBack ? iconButton({ iconName: 'arrowLeft', variant: 'secondary', onClick: onBack, ariaLabel: 'Back' }) : null,
    el('div', { style: { minWidth: 0, flex: 1 } }, [
      el('h1', { class: 'heading-page' }, title),
      subtitle ? el('p', { class: 'text-secondary text-caption', style: { marginTop: '4px' } }, subtitle) : null,
    ]),
    action || null,
  ]);
}

/* ============================== Premium bill ============================== */

/**
 * The premium branded quotation, rendered as on-screen DOM. Shared by the Review page
 * and the saved-quote detail view, and mirrored by the PDF generator (pdf.js).
 */
export function renderBill(quote, company) {
  const co = company || {};
  const brandName = (co.name || 'Kode31').toUpperCase();

  const brandMarkEl = el('div', { class: 'bill-logo-wrap' });
  if (co.logoUrl) {
    brandMarkEl.appendChild(el('img', { src: co.logoUrl, alt: brandName, class: 'bill-logo-img' }));
  } else {
    brandMarkEl.appendChild(el('h2', { class: 'bill-logo' }, brandName));
  }

  const party = (eyebrowIcon, eyebrow, name, subs, align) =>
    el('div', { class: `bill-card bill-party${align === 'right' ? ' is-right' : ''}` }, [
      el('p', { class: 'bill-eyebrow' }, [icon(eyebrowIcon, 13), eyebrow]),
      el('p', { class: 'bill-party-name' }, name || '—'),
      ...subs.filter(Boolean).map((s) => el('p', { class: 'bill-party-sub text-secondary' }, s)),
    ]);

  const totalsRows = [billTotalRow('Subtotal', formatINR(quote.subtotal))];
  if (quote.discount?.amount > 0) {
    totalsRows.push(billTotalRow(`Discount${quote.discount.type === 'percent' ? ` (${quote.discount.value}%)` : ''}`, `− ${formatINR(quote.discount.amount)}`));
  }
  if (quote.annualTotal > 0) totalsRows.push(billTotalRow('Annual charges', formatINR(quote.annualTotal)));
  if (quote.gst?.enabled) totalsRows.push(billTotalRow(`GST (${quote.gst.rate}%)`, formatINR(quote.gst.amount)));

  const preparedBy = quote.createdBy?.name || co.name || 'Kode31';

  return el('div', { class: 'bill' }, [
    // Header band
    el('div', { class: 'bill-head' }, [
      el('div', { class: 'bill-brand' }, [brandMarkEl, el('p', { class: 'bill-brand-sub' }, `${quote.divisionName || ''} Studio Quotation`)]),
      el('div', { class: 'bill-metablock' }, [
        el('p', { class: 'bill-meta-label' }, 'QUOTE NUMBER'),
        el('p', { class: 'bill-number' }, quote.quoteNumber),
        el('p', { class: 'bill-date' }, [icon('calendar', 12), formatDate(quote.createdAt)]),
      ]),
    ]),

    // Parties
    el('div', { class: 'bill-parties' }, [
      party('fileText', 'BILLED TO', quote.customer?.name, [quote.customer?.phone, quote.customer?.company]),
      party('user', 'PREPARED BY', preparedBy, [co.name || 'Kode31', co.email], 'right'),
    ]),

    // Selected services
    el('div', { class: 'bill-card bill-services' }, [
      el('p', { class: 'bill-eyebrow' }, 'SELECTED SERVICES'),
      el('div', { class: 'bill-services-head' }, [el('span', {}, 'SERVICE & DETAILS'), el('span', {}, 'PRICE')]),
      ...quote.items.map((item) =>
        el('div', { class: 'bill-item' }, [
          el('div', { class: 'bill-item-icon' }, [icon(deriveServiceIcon(item, item.categoryName), 18)]),
          el('div', { class: 'bill-item-body' }, [
            el('p', { class: 'bill-item-name' }, [item.name, item.quantity > 1 ? el('span', { class: 'text-secondary' }, `  × ${item.quantity}`) : null]),
            el('p', { class: 'bill-item-meta' }, [item.categoryName, item.businessTypeName, item.deliveryTime ? `Delivery: ${item.deliveryTime}` : null].filter(Boolean).join('  ·  ')),
            item.includes?.length ? el('div', { class: 'bill-chips' }, item.includes.join('   ·   ')) : null,
            ...(item.selectedUpgrades || []).map((u) => el('p', { class: 'bill-subline' }, [el('span', {}, `+ ${u.name}`), el('span', {}, formatINR(u.price))])),
            ...(item.annualCharges || []).filter((c) => c.included).map((c) => el('p', { class: 'bill-subline' }, [el('span', {}, `Annual · ${c.name}`), el('span', {}, `${formatINR(c.price)}/yr`)])),
          ]),
          el('p', { class: 'bill-item-price' }, formatINR(item.lineTotal)),
        ]),
      ),
      el('div', { class: 'bill-totals' }, [
        el('div', { class: 'bill-totals-box' }, [
          ...totalsRows,
          el('div', { class: 'bill-grand' }, [el('span', {}, 'Grand Total'), el('span', { class: 'bill-grand-value' }, formatINR(quote.total))]),
          el('p', { class: 'bill-grand-note' }, quote.gst?.enabled ? 'Inclusive of applicable taxes' : 'Taxes as applicable'),
        ]),
      ]),
    ]),

    // Terms
    el('div', { class: 'bill-terms' }, [
      el('div', { class: 'bill-card' }, [
        el('p', { class: 'bill-eyebrow' }, [icon('fileText', 13), 'PAYMENT TERMS']),
        el('p', { class: 'bill-term-text' }, quote.paymentTerms || 'As discussed.'),
      ]),
      el('div', { class: 'bill-card' }, [
        el('p', { class: 'bill-eyebrow' }, [icon('calendar', 13), 'VALIDITY']),
        el('p', { class: 'bill-term-text' }, `Valid for ${quote.validityDays} days from the date of issue.`),
      ]),
    ]),

    // Footer
    el('div', { class: 'bill-card bill-footer' }, [
      el('div', { class: 'bill-footer-badge' }, 'K31'),
      el('p', { class: 'bill-footer-text' }, co.footerText || 'Thank you for choosing Kode31. This quotation is generated digitally and does not require a signature.'),
      el('div', { class: 'bill-sign' }, [
        el('span', { class: 'bill-sign-mark', html: '<svg viewBox="0 0 120 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M6 28s10-20 18-18 4 22 12 22 10-24 18-24 12 16 20 16"/></svg>' }),
        el('span', { class: 'bill-sign-name' }, preparedBy),
        el('span', { class: 'bill-sign-role text-secondary' }, co.name || 'Kode31'),
      ]),
    ]),
  ]);
}

function billTotalRow(label, value) {
  return el('div', { class: 'bill-total-row' }, [el('span', {}, label), el('span', {}, value)]);
}

/* ============================== Quote review view ============================== */

export function renderQuoteReviewView(navigate) {
  if (!draft.division || !draft.customer) {
    navigate('/');
    return el('div');
  }

  if (draft.items.length === 0) {
    const empty = el('div', { style: { maxWidth: '480px', margin: '0 auto' } });
    empty.appendChild(pageHeader('Review Quote', null, () => navigate(-1)));
    empty.appendChild(
      el('div', { class: 'empty-state animate-fade-in' }, [
        tileIcon('receipt'),
        el('p', { class: 'heading-section' }, 'No services selected yet'),
        el('p', { class: 'text-secondary text-body' }, "Head back and add services to build this client's quote."),
        button({ label: 'Add Services', onClick: () => navigate(draft.division.id === 'universe' ? '/universe' : '/multiverse') }),
      ]),
    );
    return empty;
  }

  const wrapper = el('div', { class: 'animate-fade-up', style: { maxWidth: '620px', margin: '0 auto' } });
  let saving = false;
  let downloading = false;
  let companySettings = null;

  wrapper.appendChild(
    pageHeader(
      'Review Quote',
      `${draft.division.name} · ${draft.customer.name}`,
      () => navigate(-1),
      button({ label: 'Add More', icon: 'plus', size: 'sm', variant: 'secondary', onClick: () => navigate(draft.division.id === 'universe' ? '/universe' : '/multiverse') }),
    ),
  );

  const body = el('div', { class: 'stack', style: { gap: '16px' } });
  wrapper.appendChild(body);

  const billSlot = el('div');
  const adjustSlot = el('div');
  const actionSlot = el('div');
  body.appendChild(billSlot);
  body.appendChild(adjustSlot);
  body.appendChild(actionSlot);

  function refreshBill() {
    billSlot.innerHTML = '';
    billSlot.appendChild(renderBill(buildQuoteRecord(companySettings), companySettings || {}));
  }

  function renderAdjust() {
    adjustSlot.innerHTML = '';
    adjustSlot.appendChild(
      card({
        children: [
          el('p', { class: 'text-eyebrow', style: { marginBottom: '14px' } }, 'Adjustments'),
          el('div', { class: 'form-grid form-grid-2' }, [discountField(), gstField()]),
          el('div', { class: 'form-grid form-grid-2', style: { marginTop: '16px' } }, [
            textInput({ label: 'Validity (days)', type: 'number', value: draft.validityDays, onInput: (v) => { draft.validityDays = Number(v) || 0; refreshBill(); } }),
            textInput({ label: 'Payment Terms', value: draft.paymentTerms, placeholder: companySettings?.paymentTermsDefault || '50% advance…', onInput: (v) => { setPaymentTerms(v); refreshBill(); } }),
          ]),
          el('div', { style: { marginTop: '16px' } }, [textareaInput({ label: 'Notes (optional)', value: draft.notes, onInput: (v) => setNotes(v) })]),
        ],
      }),
    );
  }

  function renderActions() {
    actionSlot.innerHTML = '';
    actionSlot.appendChild(
      el('div', { class: 'grid-2', style: { gap: '12px' } }, [
        button({
          label: draft.editingId ? 'Saved ✓' : 'Save Quote',
          variant: 'secondary',
          size: 'lg',
          full: true,
          loading: saving,
          onClick: async () => {
            saving = true;
            renderActions();
            try {
              companySettings = companySettings || (await getCompanySettings());
              await saveDraftAsQuote(companySettings);
            } finally {
              saving = false;
              renderActions();
            }
          },
        }),
        button({
          label: 'Download PDF',
          icon: 'download',
          size: 'lg',
          full: true,
          loading: downloading,
          onClick: async () => {
            downloading = true;
            renderActions();
            try {
              companySettings = companySettings || (await getCompanySettings());
              generateQuotePdf(buildQuoteRecord(companySettings), companySettings);
            } finally {
              downloading = false;
              renderActions();
            }
          },
        }),
      ]),
    );
  }

  function discountField() {
    return el('div', { class: 'field' }, [
      el('span', { class: 'field-label' }, 'Discount'),
      el('div', { class: 'input-group' }, [
        el(
          'select',
          { class: 'select', style: { flex: '0 0 108px' }, onchange: (e) => { setDiscount(e.target.value, draft.discount.value); refreshBill(); } },
          [
            el('option', { value: 'flat', selected: draft.discount.type === 'flat' || undefined }, '₹ Flat'),
            el('option', { value: 'percent', selected: draft.discount.type === 'percent' || undefined }, '% Percent'),
          ],
        ),
        el('input', {
          class: 'input',
          type: 'number',
          min: 0,
          value: draft.discount.value || '',
          placeholder: '0',
          oninput: (e) => { setDiscount(draft.discount.type, Number(e.target.value) || 0); refreshBill(); },
        }),
      ]),
    ]);
  }

  function gstField() {
    return el('div', { class: 'field' }, [
      el('span', { class: 'field-label' }, 'GST'),
      el('div', { class: 'row', style: { height: '50px', padding: '0 16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', justifyContent: 'space-between' } }, [
        el('span', { class: 'text-secondary text-body' }, `${draft.gstRate}%`),
        switchToggle({ checked: draft.gstEnabled, onChange: (v) => { setGst(v); renderAdjust(); refreshBill(); } }),
      ]),
    ]);
  }

  refreshBill();
  renderAdjust();
  renderActions();
  getCompanySettings().then((s) => { companySettings = s; refreshBill(); renderAdjust(); });
  return wrapper;
}
