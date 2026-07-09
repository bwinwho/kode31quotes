// quotes.js — the in-progress quote draft (customer, selected services, pricing),
// the shared service-selection card used by both Universe and MultiVerse, the
// customer + review page views, and all Firestore CRUD for saved quotes.

import { db, COLLECTIONS, stripUndefined, nowMs } from './firebase.js';
import {
  el, card, tileIcon, icon, button, iconButton, textInput, textareaInput,
  checkRow, switchToggle, badge, formatINR, generateQuoteNumber, uid,
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
    const priceLabel = service.priceType === 'fixed' ? formatINR(service.startingPrice) : `Starting From ${formatINR(service.startingPrice)}`;

    const toggleAdd = () => {
      if (added) {
        removeItem(service.id);
        expanded = false;
      } else {
        addService(service, categoryName, businessTypeName);
        expanded = true;
      }
      if (onChange) onChange();
      paint();
    };

    const head = el(
      'div',
      { class: 'service-card-head', onClick: () => { expanded = !expanded; paint(); } },
      [
        el('div', { style: { minWidth: 0 } }, [
          el('div', { class: 'row', style: { gap: '8px', flexWrap: 'wrap' } }, [
            el('h3', { class: 'text-body-md', style: { fontSize: '17px' } }, service.name),
            service.bundlePricing?.enabled ? badge('Bundle available', 'warning') : null,
          ]),
          el('p', { class: 'text-price', style: { marginTop: '6px', fontSize: '15px' } }, priceLabel),
          service.deliveryTime ? el('p', { class: 'text-caption', style: { marginTop: '6px' } }, `Delivery: ${service.deliveryTime}`) : null,
        ]),
        button({
          label: added ? 'Added' : 'Add',
          icon: added ? 'check' : undefined,
          variant: added ? 'secondary' : 'primary',
          size: 'sm',
          onClick: (e) => { e.stopPropagation(); toggleAdd(); },
        }),
      ],
    );

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

    if (!added) {
      bodyParts.push(button({ label: 'Add to Quote', full: true, onClick: toggleAdd, size: 'lg' }));
    }

    const wrap = card({ pad: false, className: `service-card${added ? ' card-selected' : ''}` });
    wrap.appendChild(head);
    if (expanded) wrap.appendChild(el('div', { class: 'service-card-body animate-fade-in' }, bodyParts));
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
  return el('div', { class: 'quote-bar animate-fade-up' }, [
    el('div', { class: 'quote-bar-inner' }, [
      el('div', {}, [
        el('p', { class: 'text-caption' }, `${draft.items.length} service${draft.items.length > 1 ? 's' : ''} selected`),
        el('p', { class: 'text-price', style: { fontSize: '18px' } }, formatINR(total)),
      ]),
      button({ label: 'Review Quote', icon: 'arrowRight', onClick: () => navigate('/quote') }),
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

  const wrapper = el('div', { class: 'animate-fade-up', style: { maxWidth: '480px', margin: '0 auto' } });

  const form = el(
    'form',
    { class: 'stack', style: { gap: '16px', marginTop: '16px' } },
    [
      textInput({ label: 'Customer Name', value: name, placeholder: 'e.g. Aditi Sharma', required: true, autofocus: true, onInput: (v) => (name = v) }),
      textInput({ label: 'Phone Number', type: 'tel', value: phone, placeholder: 'e.g. 98765 43210', required: true, onInput: (v) => (phone = v) }),
      textInput({ label: 'Company (optional)', value: company, placeholder: 'e.g. Studio Nine', onInput: (v) => (company = v) }),
    ],
  );
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    setCustomer({ name: name.trim(), phone: phone.trim(), company: company.trim() || undefined });
    navigate(draft.division.id === 'universe' ? '/universe' : '/multiverse');
  });
  form.appendChild(button({ label: 'Continue', icon: 'arrowRight', size: 'lg', full: true, type: 'submit' }));

  wrapper.appendChild(pageHeader('Customer Details', `Starting a ${draft.division.name} quote`, () => navigate(-1)));
  wrapper.appendChild(form);
  return wrapper;
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

  function renderBody() {
    body.innerHTML = '';

    body.appendChild(
      card({
        children: [
          el('p', { class: 'text-eyebrow', style: { marginBottom: '10px' } }, 'Customer'),
          el('p', { class: 'text-body-md' }, draft.customer.name),
          el('p', { class: 'text-secondary text-caption', style: { marginTop: '2px' } }, draft.customer.phone),
          draft.customer.company ? el('p', { class: 'text-secondary text-caption' }, draft.customer.company) : null,
        ],
      }),
    );

    body.appendChild(
      card({
        children: [
          el('p', { class: 'text-eyebrow', style: { marginBottom: '4px' } }, 'Selected Services'),
          ...draft.items.map((item) =>
            el('div', { class: 'quote-line' }, [
              el('div', { style: { minWidth: 0 } }, [
                el('p', { class: 'text-body-md' }, [item.name, item.quantity > 1 ? el('span', { class: 'text-secondary' }, ` × ${item.quantity}`) : null]),
                el('p', { class: 'text-caption', style: { marginTop: '2px' } }, [item.categoryName, item.businessTypeName].filter(Boolean).join(' · ')),
                item.includes?.length ? el('p', { class: 'text-caption', style: { marginTop: '6px' } }, `Includes: ${item.includes.join(', ')}`) : null,
              ]),
              el('p', { class: 'text-price' }, formatINR(item.lineTotal)),
            ]),
          ),
        ],
      }),
    );

    body.appendChild(
      card({
        children: [
          el('p', { class: 'text-eyebrow', style: { marginBottom: '14px' } }, 'Adjustments'),
          el('div', { class: 'form-grid form-grid-2' }, [
            discountField(),
            gstField(),
          ]),
          el('div', { class: 'form-grid form-grid-2', style: { marginTop: '16px' } }, [
            textInput({ label: 'Validity (days)', type: 'number', value: draft.validityDays, onInput: (v) => (draft.validityDays = Number(v) || 0) }),
            textInput({ label: 'Payment Terms', value: draft.paymentTerms, placeholder: companySettings?.paymentTermsDefault || '50% advance…', onInput: (v) => setPaymentTerms(v) }),
          ]),
          el('div', { style: { marginTop: '16px' } }, [textareaInput({ label: 'Notes (optional)', value: draft.notes, onInput: (v) => setNotes(v) })]),
        ],
      }),
    );

    const subtotal = computeSubtotal();
    const discountAmount = computeDiscountAmount();
    const annualTotal = computeAnnualTotal();
    const gstAmount = computeGstAmount();
    const grandTotal = computeGrandTotal();

    body.appendChild(
      card({
        children: [
          totalsRow('Subtotal', formatINR(subtotal)),
          discountAmount > 0 ? totalsRow('Discount', `− ${formatINR(discountAmount)}`) : null,
          annualTotal > 0 ? totalsRow('Annual Charges', formatINR(annualTotal)) : null,
          draft.gstEnabled ? totalsRow(`GST (${draft.gstRate}%)`, formatINR(gstAmount)) : null,
          el('div', { class: 'totals-row grand' }, [
            el('span', { class: 'heading-section' }, 'Grand Total'),
            el('span', { class: 'heading-lg' }, formatINR(grandTotal)),
          ]),
        ],
      }),
    );

    body.appendChild(
      el('div', { class: 'grid-2', style: { gap: '12px' } }, [
        button({
          label: draft.editingId ? 'Saved ✓' : 'Save Quote',
          variant: 'secondary',
          size: 'lg',
          full: true,
          loading: saving,
          onClick: async () => {
            saving = true;
            renderBody();
            try {
              companySettings = companySettings || (await getCompanySettings());
              await saveDraftAsQuote(companySettings);
              renderBody();
            } finally {
              saving = false;
              renderBody();
            }
          },
        }),
        button({
          label: 'Download PDF',
          size: 'lg',
          full: true,
          loading: downloading,
          onClick: async () => {
            downloading = true;
            renderBody();
            try {
              companySettings = companySettings || (await getCompanySettings());
              const record = buildQuoteRecord(companySettings);
              generateQuotePdf(record, companySettings);
            } finally {
              downloading = false;
              renderBody();
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
          { class: 'select', style: { flex: '0 0 108px' }, onchange: (e) => setDiscount(e.target.value, draft.discount.value) },
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
          oninput: (e) => { setDiscount(draft.discount.type, Number(e.target.value) || 0); renderBody(); },
        }),
      ]),
    ]);
  }

  function gstField() {
    return el('div', { class: 'field' }, [
      el('span', { class: 'field-label' }, 'GST'),
      el('div', { class: 'row', style: { height: '50px', padding: '0 16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', justifyContent: 'space-between' } }, [
        el('span', { class: 'text-secondary text-body' }, `${draft.gstRate}%`),
        switchToggle({ checked: draft.gstEnabled, onChange: (v) => { setGst(v); renderBody(); } }),
      ]),
    ]);
  }

  getCompanySettings().then((s) => { companySettings = s; });
  renderBody();
  return wrapper;
}

function totalsRow(label, value) {
  return el('div', { class: 'totals-row' }, [el('span', { class: 'text-secondary' }, label), el('span', { class: 'text-body-md' }, value)]);
}
