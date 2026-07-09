// settings.js — Admin-only: company/bank/GST/logo/footer/payment-term settings, and
// full catalog management (services/categories/business types) with create, edit,
// delete, enable/disable, and reorder. Nothing about pricing is hardcoded elsewhere —
// this is the single place the catalog is authored.

import { db, storage, COLLECTIONS, SETTINGS_DOC_ID, stripUndefined } from './firebase.js';
import {
  el, card, button, iconButton, textInput, textareaInput, switchToggle, tabRow, icon,
  formatINR, slugify, uid, toast, confirmDialog, spinner,
} from './ui.js';
import { getCurrentProfile } from './auth.js';
import { UNIVERSE_DIVISION, UNIVERSE_SEED_CATEGORY, UNIVERSE_SEED_SERVICES } from './universe.js';
import { MULTIVERSE_DIVISION, MULTIVERSE_SEED_CATEGORIES, MULTIVERSE_SEED_BUSINESS_TYPES, MULTIVERSE_SEED_SERVICES } from './multiverse.js';

const DEFAULT_COMPANY_SETTINGS = {
  name: 'Kode31',
  logoUrl: '',
  gstNumber: '',
  bankDetails: { accountName: 'Kode31', accountNumber: '', ifsc: '', bankName: '' },
  footerText: 'Thank you for choosing Kode31. This quotation is generated digitally and does not require a signature.',
  paymentTermsDefault: '50% advance to begin work, balance on delivery.',
  validityDaysDefault: 15,
  address: '',
  phone: '',
  email: '',
  website: '',
};

/* ============================== Data access ============================== */

export async function getCompanySettings() {
  const snap = await db.collection(COLLECTIONS.settings).doc(SETTINGS_DOC_ID).get();
  return snap.exists ? snap.data() : DEFAULT_COMPANY_SETTINGS;
}

export async function saveCompanySettings(settings) {
  await db.collection(COLLECTIONS.settings).doc(SETTINGS_DOC_ID).set(stripUndefined(settings));
}

export async function isDatabaseSeeded() {
  const snap = await db.collection(COLLECTIONS.divisions).limit(1).get();
  return !snap.empty;
}

export async function seedDatabase() {
  const batch = db.batch();
  const divisions = [UNIVERSE_DIVISION, MULTIVERSE_DIVISION];
  const categories = [UNIVERSE_SEED_CATEGORY, ...MULTIVERSE_SEED_CATEGORIES];
  for (const d of divisions) batch.set(db.collection(COLLECTIONS.divisions).doc(d.id), d);
  for (const c of categories) batch.set(db.collection(COLLECTIONS.categories).doc(c.id), c);
  for (const bt of MULTIVERSE_SEED_BUSINESS_TYPES) batch.set(db.collection(COLLECTIONS.businessTypes).doc(bt.id), bt);
  for (const s of [...UNIVERSE_SEED_SERVICES, ...MULTIVERSE_SEED_SERVICES]) batch.set(db.collection(COLLECTIONS.services).doc(s.id), s);
  batch.set(db.collection(COLLECTIONS.settings).doc(SETTINGS_DOC_ID), DEFAULT_COMPANY_SETTINGS);
  await batch.commit();
}

async function saveCategory(cat) {
  await db.collection(COLLECTIONS.categories).doc(cat.id).set(stripUndefined(cat));
}
async function deleteCategoryDoc(id) {
  await db.collection(COLLECTIONS.categories).doc(id).delete();
}
async function saveBusinessType(bt) {
  await db.collection(COLLECTIONS.businessTypes).doc(bt.id).set(stripUndefined(bt));
}
async function deleteBusinessTypeDoc(id) {
  await db.collection(COLLECTIONS.businessTypes).doc(id).delete();
}
async function saveService(service) {
  await db.collection(COLLECTIONS.services).doc(service.id).set(stripUndefined(service));
}
async function deleteServiceDoc(id) {
  await db.collection(COLLECTIONS.services).doc(id).delete();
}
async function updateUserRole(uidVal, role) {
  await db.collection(COLLECTIONS.users).doc(uidVal).update({ role });
}

/* ============================== Admin shell ============================== */

export function renderAdminView() {
  const wrapper = el('div', { class: 'animate-fade-up' });
  wrapper.appendChild(el('h1', { class: 'heading-page' }, 'Admin Settings'));
  wrapper.appendChild(el('p', { class: 'text-secondary text-caption', style: { marginTop: '4px', marginBottom: '20px' } }, 'Everything here is editable without touching code'));

  let tab = 'catalog';
  const body = el('div');
  wrapper.appendChild(
    tabRow({
      tabs: [
        { id: 'catalog', label: 'Catalog & Pricing' },
        { id: 'company', label: 'Company' },
        { id: 'team', label: 'Team' },
      ],
      active: tab,
      onChange: (id) => {
        tab = id;
        renderTab();
      },
    }),
  );
  wrapper.appendChild(body);

  function renderTab() {
    body.innerHTML = '';
    if (tab === 'catalog') body.appendChild(renderCatalogTab());
    else if (tab === 'company') body.appendChild(renderCompanyTab());
    else body.appendChild(renderTeamTab());
    // repaint the tab-row active state
    const pills = wrapper.querySelectorAll('.tab-pill');
    const order = ['catalog', 'company', 'team'];
    pills.forEach((pill, i) => pill.classList.toggle('is-active', order[i] === tab));
  }

  renderTab();
  return wrapper;
}

/* ============================== Company tab ============================== */

function renderCompanyTab() {
  const container = el('div', { class: 'stack', style: { gap: '16px' } }, [spinner(true)]);

  getCompanySettings().then((settings) => {
    let form = { ...DEFAULT_COMPANY_SETTINGS, ...settings, bankDetails: { ...DEFAULT_COMPANY_SETTINGS.bankDetails, ...(settings.bankDetails || {}) } };
    container.innerHTML = '';

    let saving = false;
    let uploading = false;

    const logoPreview = el('div', { class: 'upload-row' }, [
      form.logoUrl ? el('img', { class: 'logo-preview', src: form.logoUrl }) : el('div', { class: 'logo-preview row', style: { alignItems: 'center', justifyContent: 'center' } }, [icon('image', 20)]),
      el('label', { class: 'btn btn-secondary btn-sm', style: { cursor: 'pointer' } }, [
        uploading ? 'Uploading…' : 'Upload Logo',
        el('input', {
          type: 'file',
          accept: 'image/*',
          style: { display: 'none' },
          onChange: async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            uploading = true;
            renderAll();
            try {
              const ref = storage.ref(`branding/logo-${Date.now()}-${file.name}`);
              await ref.put(file);
              form.logoUrl = await ref.getDownloadURL();
              toast('Logo uploaded', 'success');
            } catch (err) {
              toast(err.message || 'Upload failed', 'danger');
            } finally {
              uploading = false;
              renderAll();
            }
          },
        }),
      ]),
    ]);

    function renderAll() {
      container.innerHTML = '';

      container.appendChild(
        card({
          children: [
            sectionLabel('Company Details'),
            el('div', { class: 'form-grid form-grid-2' }, [
              textInput({ label: 'Company Name', value: form.name, onInput: (v) => (form.name = v) }),
              textInput({ label: 'GST Number', value: form.gstNumber, onInput: (v) => (form.gstNumber = v) }),
              textInput({ label: 'Phone', value: form.phone, onInput: (v) => (form.phone = v) }),
              textInput({ label: 'Email', value: form.email, onInput: (v) => (form.email = v) }),
              textInput({ label: 'Website', value: form.website, onInput: (v) => (form.website = v) }),
              textInput({ label: 'Address', value: form.address, onInput: (v) => (form.address = v) }),
            ]),
            el('div', { style: { marginTop: '16px' } }, [el('span', { class: 'field-label' }, 'Logo'), logoPreview]),
          ],
        }),
      );

      container.appendChild(
        card({
          children: [
            sectionLabel('Bank Details'),
            el('div', { class: 'form-grid form-grid-2' }, [
              textInput({ label: 'Account Name', value: form.bankDetails.accountName, onInput: (v) => (form.bankDetails.accountName = v) }),
              textInput({ label: 'Bank Name', value: form.bankDetails.bankName, onInput: (v) => (form.bankDetails.bankName = v) }),
              textInput({ label: 'Account Number', value: form.bankDetails.accountNumber, onInput: (v) => (form.bankDetails.accountNumber = v) }),
              textInput({ label: 'IFSC', value: form.bankDetails.ifsc, onInput: (v) => (form.bankDetails.ifsc = v) }),
            ]),
          ],
        }),
      );

      container.appendChild(
        card({
          children: [
            sectionLabel('Quote Defaults'),
            el('div', { class: 'form-grid form-grid-2' }, [
              textInput({ label: 'Default Validity (days)', type: 'number', value: form.validityDaysDefault, onInput: (v) => (form.validityDaysDefault = Number(v) || 0) }),
              textInput({ label: 'Default Payment Terms', value: form.paymentTermsDefault, onInput: (v) => (form.paymentTermsDefault = v) }),
            ]),
            el('div', { style: { marginTop: '16px' } }, [textareaInput({ label: 'Quote Footer', value: form.footerText, onInput: (v) => (form.footerText = v) })]),
          ],
        }),
      );

      container.appendChild(
        button({
          label: saving ? 'Saving…' : 'Save Company Settings',
          size: 'lg',
          full: true,
          loading: saving,
          onClick: async () => {
            saving = true;
            renderAll();
            try {
              await saveCompanySettings(form);
              toast('Company settings saved', 'success');
            } catch (err) {
              toast(err.message || 'Failed to save', 'danger');
            } finally {
              saving = false;
              renderAll();
            }
          },
        }),
      );
    }

    renderAll();
  });

  return container;
}

function sectionLabel(text) {
  return el('p', { class: 'text-eyebrow', style: { marginBottom: '14px' } }, text);
}

/* ============================== Catalog tab ============================== */

function renderCatalogTab() {
  const wrapper = el('div', { class: 'stack', style: { gap: '16px' } });
  let divisionId = 'universe';
  let selectedCategoryId = null;
  let selectedBusinessTypeId = null;

  const divisionTabs = el('div', { class: 'row', style: { gap: '8px' } });
  const body = el('div', { class: 'stack', style: { gap: '16px' } });
  wrapper.appendChild(divisionTabs);
  wrapper.appendChild(body);

  function renderDivisionTabs() {
    divisionTabs.innerHTML = '';
    for (const [id, label, iconName] of [['universe', 'Universe', 'music'], ['multiverse', 'MultiVerse', 'layers']]) {
      divisionTabs.appendChild(
        el(
          'button',
          {
            class: `tab-pill${divisionId === id ? ' is-active' : ''}`,
            type: 'button',
            onClick: () => { divisionId = id; selectedCategoryId = null; selectedBusinessTypeId = null; renderDivisionTabs(); renderBody(); },
          },
          [icon(iconName, 14), ' ', label],
        ),
      );
    }
  }

  async function renderBody() {
    body.innerHTML = '';
    body.appendChild(spinner());

    const categoriesSnap = await db.collection(COLLECTIONS.categories).where('divisionId', '==', divisionId).get();
    const categories = categoriesSnap.docs.map((d) => d.data()).sort((a, b) => a.order - b.order);
    body.innerHTML = '';

    body.appendChild(renderCategoryManager(divisionId, categories, selectedCategoryId, (id) => { selectedCategoryId = id; selectedBusinessTypeId = null; renderBody(); }, renderBody));

    const activeCategory = categories.find((c) => c.id === selectedCategoryId);
    if (activeCategory?.hasBusinessTypes) {
      const btSnap = await db.collection(COLLECTIONS.businessTypes).where('categoryId', '==', activeCategory.id).get();
      const businessTypes = btSnap.docs.map((d) => d.data()).sort((a, b) => a.order - b.order);
      body.appendChild(
        renderBusinessTypeManager(activeCategory, businessTypes, selectedBusinessTypeId, (id) => { selectedBusinessTypeId = id; renderBody(); }, renderBody),
      );
      if (selectedBusinessTypeId) {
        const bt = businessTypes.find((b) => b.id === selectedBusinessTypeId);
        body.appendChild(await renderServiceSection(divisionId, activeCategory.id, selectedBusinessTypeId, `${bt?.name || ''} Modules`, renderBody));
      }
    } else if (activeCategory) {
      body.appendChild(await renderServiceSection(divisionId, activeCategory.id, null, `${activeCategory.name} Services`, renderBody));
    }
  }

  renderDivisionTabs();
  renderBody();
  return wrapper;
}

function renderCategoryManager(divisionId, categories, activeId, onSelect, refresh) {
  let adding = false;
  const wrapper = card({ children: [] });

  function paint() {
    wrapper.innerHTML = '';
    wrapper.appendChild(
      el('div', { class: 'section-head' }, [
        sectionLabel('Categories'),
        el('button', { class: 'text-caption', style: { color: 'var(--color-text)', fontWeight: '600' }, onClick: () => { adding = !adding; paint(); } }, adding ? 'Cancel' : '+ Add Category'),
      ]),
    );

    if (adding) {
      let name = '';
      const row = el('div', { class: 'row', style: { gap: '8px', marginBottom: '12px' } });
      const input = textInput({ value: name, placeholder: 'Category name', onInput: (v) => (name = v) });
      row.appendChild(el('div', { style: { flex: 1 } }, [input]));
      row.appendChild(
        button({
          label: 'Add',
          onClick: async () => {
            if (!name.trim()) return;
            await saveCategory({ id: `${divisionId}-${slugify(name)}`, divisionId, name: name.trim(), slug: slugify(name), icon: 'sparkle', order: categories.length + 1, active: true });
            adding = false;
            refresh();
          },
        }),
      );
      wrapper.appendChild(row);
    }

    const list = el('div', {});
    categories.forEach((cat, i) => {
      list.appendChild(
        el('div', { class: 'admin-row', style: { marginBottom: '8px', cursor: 'pointer' }, onClick: () => onSelect(cat.id) }, [
          el('span', { class: 'row', style: { gap: '10px' } }, [icon(cat.icon || 'sparkle', 16), el('span', { class: cat.id === activeId ? 'text-body-md' : 'text-body' }, cat.name)]),
          el('span', { class: 'admin-row-actions' }, [
            reorderButtons(categories, i, saveCategory, refresh),
            iconButton({ iconName: 'checkCircle', size: 'sm', variant: cat.active ? 'ghost' : 'ghost', onClick: (e) => { e.stopPropagation(); saveCategory({ ...cat, active: !cat.active }).then(refresh); }, ariaLabel: 'Toggle active' }),
            iconButton({
              iconName: 'trash', size: 'sm', variant: 'ghost',
              onClick: async (e) => {
                e.stopPropagation();
                const ok = await confirmDialog({ title: `Delete "${cat.name}"?`, message: 'Services under it will remain but be hidden.', confirmLabel: 'Delete', danger: true });
                if (ok) { await deleteCategoryDoc(cat.id); refresh(); }
              },
              ariaLabel: 'Delete',
            }),
          ]),
        ]),
      );
    });
    wrapper.appendChild(list);
  }

  paint();
  return wrapper;
}

function renderBusinessTypeManager(category, businessTypes, activeId, onSelect, refresh) {
  let adding = false;
  const wrapper = card({ children: [] });

  function paint() {
    wrapper.innerHTML = '';
    wrapper.appendChild(
      el('div', { class: 'section-head' }, [
        sectionLabel('Business Types'),
        el('button', { class: 'text-caption', style: { color: 'var(--color-text)', fontWeight: '600' }, onClick: () => { adding = !adding; paint(); } }, adding ? 'Cancel' : '+ Add Business Type'),
      ]),
    );

    if (adding) {
      let name = '';
      const row = el('div', { class: 'row', style: { gap: '8px', marginBottom: '12px' } });
      row.appendChild(el('div', { style: { flex: 1 } }, [textInput({ value: name, placeholder: 'e.g. Salon', onInput: (v) => (name = v) })]));
      row.appendChild(
        button({
          label: 'Add',
          onClick: async () => {
            if (!name.trim()) return;
            await saveBusinessType({ id: `${category.id}-${slugify(name)}`, categoryId: category.id, name: name.trim(), icon: 'smartphone', order: businessTypes.length + 1, active: true });
            adding = false;
            refresh();
          },
        }),
      );
      wrapper.appendChild(row);
    }

    const list = el('div', {});
    businessTypes.forEach((bt, i) => {
      list.appendChild(
        el('div', { class: 'admin-row', style: { marginBottom: '8px', cursor: 'pointer' }, onClick: () => onSelect(bt.id) }, [
          el('span', { class: bt.id === activeId ? 'text-body-md' : 'text-body' }, bt.name),
          el('span', { class: 'admin-row-actions' }, [
            reorderButtons(businessTypes, i, saveBusinessType, refresh),
            iconButton({
              iconName: 'trash', size: 'sm', variant: 'ghost',
              onClick: async (e) => {
                e.stopPropagation();
                const ok = await confirmDialog({ title: `Delete "${bt.name}"?`, message: 'This cannot be undone.', confirmLabel: 'Delete', danger: true });
                if (ok) { await deleteBusinessTypeDoc(bt.id); refresh(); }
              },
              ariaLabel: 'Delete',
            }),
          ]),
        ]),
      );
    });
    wrapper.appendChild(list);
  }

  paint();
  return wrapper;
}

function reorderButtons(list, index, saveFn, refresh) {
  return el('span', { class: 'row', style: { gap: '2px' } }, [
    iconButton({
      iconName: 'chevronUp', size: 'sm', variant: 'ghost', ariaLabel: 'Move up',
      onClick: async (e) => {
        e.stopPropagation();
        if (index === 0) return;
        const a = list[index], b = list[index - 1];
        await Promise.all([saveFn({ ...a, order: b.order }), saveFn({ ...b, order: a.order })]);
        refresh();
      },
    }),
    iconButton({
      iconName: 'chevronDown', size: 'sm', variant: 'ghost', ariaLabel: 'Move down',
      onClick: async (e) => {
        e.stopPropagation();
        if (index === list.length - 1) return;
        const a = list[index], b = list[index + 1];
        await Promise.all([saveFn({ ...a, order: b.order }), saveFn({ ...b, order: a.order })]);
        refresh();
      },
    }),
  ]);
}

async function renderServiceSection(divisionId, categoryId, businessTypeId, title, refresh) {
  const query = businessTypeId
    ? db.collection(COLLECTIONS.services).where('businessTypeId', '==', businessTypeId)
    : db.collection(COLLECTIONS.services).where('categoryId', '==', categoryId);
  const snap = await query.get();
  const services = snap.docs.map((d) => d.data()).filter((s) => (businessTypeId ? true : !s.businessTypeId)).sort((a, b) => a.order - b.order);

  let addingForm = null;
  let editingId = null;

  const wrapper = card({ children: [] });

  function paint() {
    wrapper.innerHTML = '';
    wrapper.appendChild(
      el('div', { class: 'section-head' }, [
        sectionLabel(title),
        el(
          'button',
          { class: 'text-caption', style: { color: 'var(--color-text)', fontWeight: '600' }, onClick: () => { addingForm = addingForm ? null : true; paint(); } },
          addingForm ? 'Cancel' : '+ Add Service',
        ),
      ]),
    );

    if (addingForm) {
      wrapper.appendChild(
        renderServiceForm({
          divisionId, categoryId, businessTypeId, order: services.length + 1,
          onCancel: () => { addingForm = null; paint(); },
          onSave: async (service) => { await saveService(service); addingForm = null; refresh(); },
        }),
      );
    }

    if (services.length === 0 && !addingForm) {
      wrapper.appendChild(el('p', { class: 'text-secondary text-caption' }, 'No services yet.'));
    }

    services.forEach((service, i) => {
      if (editingId === service.id) {
        wrapper.appendChild(
          renderServiceForm({
            initial: service, divisionId, categoryId, businessTypeId, order: service.order,
            onCancel: () => { editingId = null; paint(); },
            onSave: async (updated) => { await saveService(updated); editingId = null; refresh(); },
          }),
        );
        return;
      }
      wrapper.appendChild(
        el('div', { class: 'admin-row', style: { marginBottom: '8px' } }, [
          el('div', { style: { minWidth: 0 } }, [
            el('p', { class: 'text-body-md', style: { fontSize: '14px' } }, service.name),
            el('p', { class: 'text-caption' }, `${service.priceType === 'fixed' ? formatINR(service.startingPrice) : `From ${formatINR(service.startingPrice)}`}${service.deliveryTime ? ` · ${service.deliveryTime}` : ''}`),
          ]),
          el('span', { class: 'admin-row-actions' }, [
            reorderButtons(services, i, saveService, refresh),
            switchToggle({ checked: service.active, onChange: (v) => saveService({ ...service, active: v }).then(refresh) }),
            iconButton({ iconName: 'pencil', size: 'sm', variant: 'ghost', onClick: () => { editingId = service.id; paint(); }, ariaLabel: 'Edit' }),
            iconButton({
              iconName: 'trash', size: 'sm', variant: 'ghost',
              onClick: async () => {
                const ok = await confirmDialog({ title: `Delete "${service.name}"?`, message: 'This cannot be undone.', confirmLabel: 'Delete', danger: true });
                if (ok) { await deleteServiceDoc(service.id); refresh(); }
              },
              ariaLabel: 'Delete',
            }),
          ]),
        ]),
      );
    });
  }

  paint();
  return wrapper;
}

/* ---- Service edit form ---- */

function renderServiceForm({ initial, divisionId, categoryId, businessTypeId, order, onCancel, onSave }) {
  const state = {
    name: initial?.name || '',
    description: initial?.description || '',
    startingPrice: initial?.startingPrice || 0,
    priceType: initial?.priceType || 'starting',
    deliveryTime: initial?.deliveryTime || '',
    includesText: (initial?.includes || []).join(', '),
    upgrades: (initial?.optionalUpgrades || []).map((u) => ({ ...u })),
    annualCharges: (initial?.annualCharges || []).map((c) => ({ ...c })),
    bundleEnabled: initial?.bundlePricing?.enabled || false,
    bundleUnitLabel: initial?.bundlePricing?.unitLabel || 'unit',
    bundleUnitPrice: initial?.bundlePricing?.unitPrice || 0,
    bundleMinUnits: initial?.bundlePricing?.minUnits || 1,
    bundleMinLabel: initial?.bundlePricing?.minUnitsLabel || '',
    active: initial?.active ?? true,
  };

  const wrapper = el('div', { class: 'card card-pad', style: { border: '1px solid var(--color-border-strong)', marginBottom: '12px' } });

  function paint() {
    wrapper.innerHTML = '';
    wrapper.appendChild(
      el('div', { class: 'form-grid form-grid-2' }, [
        textInput({ label: 'Service Name', value: state.name, placeholder: 'e.g. Original Song', onInput: (v) => (state.name = v) }),
        (function () {
          const select = el(
            'select',
            { class: 'select', onchange: (e) => (state.priceType = e.target.value) },
            [
              el('option', { value: 'starting', selected: state.priceType === 'starting' || undefined }, 'Starting From'),
              el('option', { value: 'fixed', selected: state.priceType === 'fixed' || undefined }, 'Fixed Price'),
              el('option', { value: 'bundle', selected: state.priceType === 'bundle' || undefined }, 'Bundle'),
            ],
          );
          return el('div', { class: 'field' }, [el('span', { class: 'field-label' }, 'Price Type'), select]);
        })(),
        textInput({ label: 'Starting Price (₹)', type: 'number', value: state.startingPrice, onInput: (v) => (state.startingPrice = Number(v) || 0) }),
        textInput({ label: 'Delivery Time', value: state.deliveryTime, placeholder: 'e.g. 1-2 weeks', onInput: (v) => (state.deliveryTime = v) }),
      ]),
    );

    wrapper.appendChild(el('div', { style: { marginTop: '12px' } }, [textInput({ label: 'Includes (comma separated)', value: state.includesText, onInput: (v) => (state.includesText = v) })]));
    wrapper.appendChild(el('div', { style: { marginTop: '12px' } }, [textareaInput({ label: 'Description (optional)', value: state.description, onInput: (v) => (state.description = v) })]));

    wrapper.appendChild(listEditor('Optional Enhancements', state.upgrades, () => paint()));
    wrapper.appendChild(listEditor('Optional Yearly Charges', state.annualCharges, () => paint(), true));

    wrapper.appendChild(
      el('div', { style: { marginTop: '16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px' } }, [
        el('div', { class: 'row', style: { justifyContent: 'space-between' } }, [
          el('span', { class: 'text-body-md', style: { fontSize: '14px' } }, 'Bundle Pricing'),
          switchToggle({ checked: state.bundleEnabled, onChange: (v) => { state.bundleEnabled = v; paint(); } }),
        ]),
        state.bundleEnabled
          ? el('div', { class: 'form-grid form-grid-2', style: { marginTop: '12px' } }, [
              textInput({ label: 'Unit Label', value: state.bundleUnitLabel, placeholder: 'post', onInput: (v) => (state.bundleUnitLabel = v) }),
              textInput({ label: 'Unit Price (₹)', type: 'number', value: state.bundleUnitPrice, onInput: (v) => (state.bundleUnitPrice = Number(v) || 0) }),
              textInput({ label: 'Minimum Units', type: 'number', value: state.bundleMinUnits, onInput: (v) => (state.bundleMinUnits = Number(v) || 1) }),
              textInput({ label: 'Minimum Label', value: state.bundleMinLabel, placeholder: '4 posts/month', onInput: (v) => (state.bundleMinLabel = v) }),
            ])
          : null,
      ]),
    );

    wrapper.appendChild(
      el('div', { class: 'row', style: { justifyContent: 'space-between', marginTop: '16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px' } }, [
        el('span', { class: 'text-body-md', style: { fontSize: '14px' } }, 'Active (visible to team)'),
        switchToggle({ checked: state.active, onChange: (v) => { state.active = v; } }),
      ]),
    );

    wrapper.appendChild(
      el('div', { class: 'grid-2', style: { gap: '10px', marginTop: '16px' } }, [
        button({ label: 'Cancel', variant: 'secondary', full: true, onClick: onCancel }),
        button({
          label: 'Save Service', full: true,
          onClick: async () => {
            if (!state.name.trim()) return;
            const service = {
              id: initial?.id || `${categoryId}-${slugify(state.name)}-${Date.now().toString(36)}`,
              divisionId,
              categoryId,
              businessTypeId: businessTypeId || null,
              name: state.name.trim(),
              description: state.description.trim() || undefined,
              startingPrice: state.startingPrice,
              priceType: state.priceType,
              deliveryTime: state.deliveryTime.trim() || undefined,
              includes: state.includesText.split(',').map((s) => s.trim()).filter(Boolean),
              optionalUpgrades: state.upgrades.filter((u) => u.name.trim()),
              annualCharges: state.annualCharges.filter((c) => c.name.trim()),
              bundlePricing: state.bundleEnabled
                ? { enabled: true, unitLabel: state.bundleUnitLabel, unitPrice: state.bundleUnitPrice, minUnits: state.bundleMinUnits, minUnitsLabel: state.bundleMinLabel }
                : null,
              order: initial?.order ?? order,
              active: state.active,
            };
            await onSave(service);
          },
        }),
      ]),
    );
  }

  function listEditor(title, rows, rerender, withDefault) {
    const box = el('div', { style: { marginTop: '16px' } });
    box.appendChild(el('span', { class: 'field-label' }, title));
    const list = el('div', { class: 'stack', style: { gap: '8px', marginTop: '8px' } });
    rows.forEach((row, i) => {
      list.appendChild(
        el('div', { class: 'list-editor-row' }, [
          el('input', { class: 'input', value: row.name, placeholder: 'Name', style: { flex: 1 }, oninput: (e) => (row.name = e.target.value) }),
          el('input', { class: 'input', type: 'number', value: row.price, placeholder: '₹', style: { width: '96px' }, oninput: (e) => (row.price = Number(e.target.value) || 0) }),
          withDefault ? switchToggle({ checked: row.defaultIncluded, onChange: (v) => { row.defaultIncluded = v; } }) : null,
          iconButton({ iconName: 'x', size: 'sm', variant: 'ghost', onClick: () => { rows.splice(i, 1); rerender(); }, ariaLabel: 'Remove' }),
        ]),
      );
    });
    box.appendChild(list);
    box.appendChild(
      el(
        'button',
        {
          class: 'text-caption',
          style: { marginTop: '4px', color: 'var(--color-text-secondary)' },
          onClick: () => { rows.push({ id: uid(), name: '', price: 0, defaultIncluded: false }); rerender(); },
        },
        `+ Add`,
      ),
    );
    return box;
  }

  paint();
  return wrapper;
}

/* ============================== Team tab ============================== */

function renderTeamTab() {
  const container = el('div', {});
  const self = getCurrentProfile();

  db.collection(COLLECTIONS.users)
    .get()
    .then((snap) => {
      const team = snap.docs.map((d) => d.data());
      container.appendChild(
        card({
          children: [
            sectionLabel('Team Members'),
            ...team.map((member) =>
              el('div', { class: 'admin-row', style: { marginBottom: '8px' } }, [
                el('span', { class: 'row', style: { gap: '10px' } }, [
                  el('span', { class: 'avatar' }, member.name?.slice(0, 1).toUpperCase() || '?'),
                  el('span', {}, [el('p', { class: 'text-body-md', style: { fontSize: '14px' } }, member.name), el('p', { class: 'text-caption' }, member.email)]),
                ]),
                (function () {
                  const select = el(
                    'select',
                    {
                      class: 'select', style: { height: '36px', width: '150px' },
                      disabled: member.uid === self?.uid,
                      onchange: (e) => updateUserRole(member.uid, e.target.value).then(() => toast('Role updated', 'success')),
                    },
                    [
                      el('option', { value: 'admin', selected: member.role === 'admin' || undefined }, 'Admin'),
                      el('option', { value: 'member', selected: member.role === 'member' || undefined }, 'Team Member'),
                    ],
                  );
                  return select;
                })(),
              ]),
            ),
          ],
        }),
      );
    });

  return container;
}
