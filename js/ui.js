// ui.js — the design system. Every reusable visual building block (buttons, cards,
// inputs, dropdowns, dialogs, badges, bottom sheets, toasts) lives here so no other
// module hand-rolls markup or duplicates styling.

/* ============================== DOM helpers ============================== */

/** Hyperscript-style element builder. `on*` props bind listeners, `class`/`html` are special. */
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key === 'style' && typeof value === 'object') Object.assign(node.style, value);
    else if (key === 'dataset' && typeof value === 'object') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'value' && 'value' in node) node.value = value;
    else if (key === 'checked') node.checked = value;
    else node.setAttribute(key, value === true ? '' : value);
  }
  const list = Array.isArray(children) ? children : [children];
  for (const child of list.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    node.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export function mount(container, node) {
  clear(container);
  container.appendChild(node);
}

export function qs(selector, root = document) {
  return root.querySelector(selector);
}

/* ============================== Formatting ============================== */

export function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
}

export function formatDate(timestamp) {
  if (!timestamp) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(timestamp));
}

export function slugify(text) {
  return String(text).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function uid() {
  return (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
}

export function generateQuoteNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `K31-${y}${m}-${rand}`;
}

export function debounce(fn, wait = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

/* ============================== Icons ============================== */
// Outline, monochrome, 24x24, stroke-based — consistent with Lucide's visual language.

const ICON_PATHS = {
  home: '<path d="M3 9.5 12 3l9 6.5"/><path d="M5 9v11a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1V9"/>',
  arrowLeft: '<path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>',
  arrowRight: '<path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>',
  chevronDown: '<path d="M6 9l6 6 6-6"/>',
  chevronRight: '<path d="M9 18l6-6-6-6"/>',
  chevronUp: '<path d="M18 15l-6-6-6 6"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  x: '<path d="M18 6 6 18"/><path d="M6 6l12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  pencil: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  fileText: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/>',
  building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  logOut: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>',
  moreVertical: '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
  banknote: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01"/><path d="M18 12h.01"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  layers: '<path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
  package: '<path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05"/><path d="M12 22.08V12"/>',
  tag: '<path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.41l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  percent: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  smartphone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
  palette: '<circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2a10 10 0 1 0 0 20 3 3 0 0 0 3-3 2 2 0 0 1 2-2h1a5 5 0 0 0 5-5A10 10 0 0 0 12 2z"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  checkCircle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m22 4-10 10.01-3-3"/>',
  alertCircle: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  mapPin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  creditCard: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  sparkle: '<path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.13-1.58a.5.5 0 0 1 0-.96l6.13-1.58A2 2 0 0 0 9.94 8.5l1.58-6.13a.5.5 0 0 1 .96 0l1.58 6.13a2 2 0 0 0 1.44 1.44l6.13 1.58a.5.5 0 0 1 0 .96l-6.13 1.58a2 2 0 0 0-1.44 1.44l-1.58 6.13a.5.5 0 0 1-.96 0z"/>',
  identification: '<rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="8" cy="10" r="2"/><path d="M4 16c0-1.66 1.79-3 4-3s4 1.34 4 3"/><path d="M14 9h6"/><path d="M14 13h6"/>',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  signature: '<path d="M3 17s2.5-6 5-6 2 4 4 4 3-8 5-8 4 4 4 4"/><path d="M3 21h18"/>',
};

export function icon(name, size = 20) {
  const paths = ICON_PATHS[name] || ICON_PATHS.sparkle;
  return el('span', {
    class: 'icon',
    html: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`,
  });
}

/* ============================== Buttons ============================== */

export function button({ label = '', variant = 'primary', size = '', icon: iconName, onClick, disabled, loading, type = 'button', full } = {}) {
  const classes = ['btn', `btn-${variant}`];
  if (size) classes.push(`btn-${size}`);
  if (full) classes.push('btn-block');
  const btn = el('button', { class: classes.join(' '), type, disabled: disabled || loading, onClick }, [
    loading ? el('span', { class: 'spinner' }) : (iconName ? icon(iconName, size === 'sm' ? 16 : 18) : null),
    label,
  ]);
  return btn;
}

export function iconButton({ iconName, variant = 'ghost', size = '', onClick, ariaLabel, disabled }) {
  const classes = ['btn', 'btn-icon', `btn-${variant}`];
  if (size) classes.push(`btn-${size}`);
  return el('button', { class: classes.join(' '), type: 'button', onClick, 'aria-label': ariaLabel || '', disabled }, [icon(iconName, size === 'sm' ? 16 : 20)]);
}

/* ============================== Cards ============================== */

export function card({ children = [], interactive, selected, onClick, className = '', pad = true } = {}) {
  const classes = ['card', className];
  if (pad) classes.push('card-pad');
  if (interactive) classes.push('card-interactive');
  if (selected) classes.push('card-selected');
  return el('div', { class: classes.join(' '), onClick }, children);
}

export function tileIcon(name) {
  return el('div', { class: 'tile-icon' }, [icon(name, 24)]);
}

/** Circular outline icon with a soft radial glow behind it (used on cards & pickers). */
export function glowIcon(name, size = 24) {
  return el('div', { class: 'glow-icon' }, [icon(name, size)]);
}

/**
 * The Kode31 brand mark. Prefers assets/logo.png; if that 404s (not uploaded yet)
 * it swaps to a clean "K" monogram so the UI never shows a broken image.
 */
export function brandMark({ size = 44, rounded = 'var(--radius-md)' } = {}) {
  const wrap = el('div', {
    class: 'brand-mark',
    style: { width: `${size}px`, height: `${size}px`, borderRadius: rounded },
  });
  const img = el('img', {
    src: 'assets/logo.png',
    alt: 'Kode31',
    style: { width: '100%', height: '100%', objectFit: 'contain', borderRadius: rounded },
  });
  img.addEventListener('error', () => {
    wrap.classList.add('brand-mark--fallback');
    wrap.innerHTML = '';
    wrap.appendChild(el('span', { style: { fontWeight: '800', fontSize: `${Math.round(size * 0.42)}px` } }, 'K'));
  });
  wrap.appendChild(img);
  return wrap;
}

/* ============================== Inputs ============================== */

export function field({ label, input, hint } = {}) {
  return el('div', { class: 'field' }, [
    label ? el('span', { class: 'field-label' }, label) : null,
    input,
    hint ? el('span', { class: 'text-caption' }, hint) : null,
  ]);
}

export function textInput({ label, type = 'text', value = '', placeholder = '', onInput, required, min, hint, autofocus } = {}) {
  const input = el('input', {
    class: 'input',
    type,
    value,
    placeholder,
    required: required || undefined,
    min,
    autofocus: autofocus || undefined,
    oninput: onInput ? (e) => onInput(e.target.value, e) : undefined,
  });
  return field({ label, input, hint });
}

export function textareaInput({ label, value = '', placeholder = '', onInput } = {}) {
  const input = el('textarea', { class: 'textarea', placeholder, oninput: onInput ? (e) => onInput(e.target.value, e) : undefined }, value);
  return field({ label, input });
}

export function selectInput({ label, value, options = [], onChange } = {}) {
  const select = el(
    'select',
    { class: 'select', onchange: onChange ? (e) => onChange(e.target.value, e) : undefined },
    options.map((opt) => el('option', { value: opt.value, selected: opt.value === value || undefined }, opt.label)),
  );
  return field({ label, input: select });
}

/* ============================== Check rows / switches ============================== */

export function checkRow({ label, price, checked, onChange, disabled, icon: iconName } = {}) {
  const row = el(
    'button',
    { class: `check-row${checked ? ' is-checked' : ''}`, type: 'button', disabled, onClick: () => onChange && onChange(!checked) },
    [
      el('span', { class: 'check-row-left' }, [
        el('span', { class: 'checkbox' }, [el('span', { html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>' })]),
        iconName ? icon(iconName, 16) : null,
        el('span', { class: 'text-body' }, label),
      ]),
      price ? el('span', { class: 'text-price text-secondary' }, price) : null,
    ],
  );
  return row;
}

export function switchToggle({ checked, onChange } = {}) {
  return el('button', { class: `switch${checked ? ' is-on' : ''}`, type: 'button', onClick: () => onChange && onChange(!checked) });
}

export function qtyStepper({ value, onChange, min = 1 } = {}) {
  return el('div', { class: 'qty-stepper' }, [
    el('button', { type: 'button', onClick: () => onChange(Math.max(min, value - 1)) }, '−'),
    el('span', {}, String(value)),
    el('button', { type: 'button', onClick: () => onChange(value + 1) }, '+'),
  ]);
}

/* ============================== Badges ============================== */

export function badge(text, variant = '') {
  return el('span', { class: `badge${variant ? ` badge-${variant}` : ''}` }, text);
}

const STATUS_VARIANT = { Draft: '', Sent: 'info', Signed: 'warning', Accepted: 'success', Rejected: 'danger' };

export function statusBadge(status) {
  return badge(status, STATUS_VARIANT[status] || '');
}

/* ============================== Empty state / loading ============================== */

export function emptyState({ iconName = 'sparkle', title, description, action } = {}) {
  return el('div', { class: 'empty-state animate-fade-in' }, [
    tileIcon(iconName),
    el('p', { class: 'heading-section' }, title),
    description ? el('p', { class: 'text-secondary text-body' }, description) : null,
    action || null,
  ]);
}

export function spinner(large) {
  return el('span', { class: `spinner${large ? ' spinner-lg' : ''}` });
}

export function loadingScreen(message = 'Loading Kode31 Quote Studio…') {
  return el('div', { class: 'loading-screen' }, [spinner(true), el('span', { class: 'text-caption' }, message)]);
}

/* ============================== Toasts ============================== */

export function toast(message, variant = '') {
  const root = document.getElementById('toast-root');
  if (!root) return;
  const iconName = variant === 'success' ? 'checkCircle' : variant === 'danger' ? 'alertCircle' : 'info';
  const node = el('div', { class: `toast${variant ? ` toast-${variant}` : ''}` }, [icon(iconName, 18), el('span', {}, message)]);
  root.appendChild(node);
  setTimeout(() => {
    node.style.transition = 'opacity 200ms ease';
    node.style.opacity = '0';
    setTimeout(() => node.remove(), 200);
  }, 3200);
}

/* ============================== Dialogs ============================== */

let activeDialogClose = null;

export function openDialog({ title, content, wide, onClose } = {}) {
  const root = document.getElementById('dialog-root');
  const close = () => {
    clear(root);
    activeDialogClose = null;
    if (onClose) onClose();
  };
  activeDialogClose = close;

  const overlay = el('div', { class: 'overlay', onClick: (e) => { if (e.target === overlay) close(); } }, [
    el('div', { class: `dialog${wide ? ' dialog-wide' : ''}` }, [
      el('div', { class: 'dialog-head' }, [
        el('h3', { class: 'heading-section' }, title),
        iconButton({ iconName: 'x', size: 'sm', onClick: close, ariaLabel: 'Close' }),
      ]),
      content,
    ]),
  ]);
  mount(root, overlay);
  return close;
}

export function closeDialog() {
  if (activeDialogClose) activeDialogClose();
}

export function confirmDialog({ title, message, confirmLabel = 'Confirm', danger = false }) {
  return new Promise((resolve) => {
    const finish = (result) => {
      closeDialog();
      resolve(result);
    };
    openDialog({
      title,
      onClose: () => resolve(false),
      content: el('div', {}, [
        el('p', { class: 'text-secondary text-body' }, message),
        el('div', { class: 'dialog-actions' }, [
          button({ label: 'Cancel', variant: 'secondary', onClick: () => finish(false) }),
          button({ label: confirmLabel, variant: danger ? 'danger' : 'primary', onClick: () => finish(true) }),
        ]),
      ]),
    });
  });
}

/* ============================== Bottom sheets ============================== */

let activeSheetClose = null;

export function openSheet({ title, content } = {}) {
  const root = document.getElementById('sheet-root');
  const close = () => {
    clear(root);
    activeSheetClose = null;
  };
  activeSheetClose = close;

  const overlay = el('div', { class: 'sheet-overlay', onClick: (e) => { if (e.target === overlay) close(); } }, [
    el('div', { class: 'sheet' }, [
      el('div', { class: 'sheet-handle' }),
      title
        ? el('div', { class: 'dialog-head' }, [el('h3', { class: 'heading-section' }, title), iconButton({ iconName: 'x', size: 'sm', onClick: close, ariaLabel: 'Close' })])
        : null,
      content,
    ]),
  ]);
  mount(root, overlay);
  return close;
}

export function closeSheet() {
  if (activeSheetClose) activeSheetClose();
}

/* ============================== Tabs ============================== */

export function tabRow({ tabs, active, onChange }) {
  return el(
    'div',
    { class: 'tab-row' },
    tabs.map((tab) => el('button', { class: `tab-pill${tab.id === active ? ' is-active' : ''}`, type: 'button', onClick: () => onChange(tab.id) }, tab.label)),
  );
}
