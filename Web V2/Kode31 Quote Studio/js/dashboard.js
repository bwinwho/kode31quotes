// dashboard.js — the quotes pipeline: stats, search/filter, open/duplicate/edit/delete,
// and the Signed Customers roster (a lightweight CRM view over Signed/Accepted quotes).

import { el, card, statusBadge, iconButton, button, emptyState, spinner, formatDate, formatINR, toast, confirmDialog } from './ui.js';
import { listenQuotes, getQuoteById, duplicateQuote, deleteQuote, updateQuoteStatus, loadQuoteIntoDraft } from './quotes.js';
import { getCompanySettings } from './settings.js';
import { generateQuotePdf } from './pdf.js';

const STATUSES = ['Draft', 'Sent', 'Signed', 'Accepted', 'Rejected'];

export function renderDashboardView(navigate) {
  const wrapper = el('div', { class: 'animate-fade-up' });
  wrapper.appendChild(el('h1', { class: 'heading-page' }, 'Dashboard'));
  wrapper.appendChild(el('p', { class: 'text-secondary text-caption', style: { marginTop: '4px', marginBottom: '20px' } }, 'Every quotation, live'));

  const statGrid = el('div', { class: 'stat-grid section' });
  wrapper.appendChild(statGrid);

  const filterRow = el('div', { class: 'filter-row' });
  wrapper.appendChild(filterRow);

  const listRoot = el('div', {});
  wrapper.appendChild(listRoot);

  let quotes = [];
  let search = '';
  let statusFilter = 'All';
  let memberFilter = 'All';

  const unsubscribe = listenQuotes((items) => {
    quotes = items;
    renderStats();
    renderFilters();
    renderList();
  });
  wrapper.cleanup = unsubscribe;

  function renderStats() {
    statGrid.innerHTML = '';
    const signedCustomers = new Set(quotes.filter((q) => q.status === 'Signed' || q.status === 'Accepted').map((q) => q.customer?.phone)).size;
    const tiles = [
      ['Total Quotes', quotes.length],
      ['Draft', quotes.filter((q) => q.status === 'Draft').length],
      ['Sent', quotes.filter((q) => q.status === 'Sent').length],
      ['Accepted', quotes.filter((q) => q.status === 'Accepted').length],
      ['Rejected', quotes.filter((q) => q.status === 'Rejected').length],
      ['Signed Customers', signedCustomers],
    ];
    for (const [label, value] of tiles) {
      statGrid.appendChild(card({ className: 'stat-tile', children: [el('p', { class: 'text-caption' }, label), el('p', { class: 'stat-tile-value' }, String(value))] }));
    }
  }

  function renderFilters() {
    filterRow.innerHTML = '';
    const members = ['All', ...new Set(quotes.map((q) => q.createdBy?.name).filter(Boolean))];

    const search_ = el('div', { class: 'search', style: { minWidth: '220px', flex: '1 1 220px' } }, [
      (function () {
        const s = el('span', {});
        s.appendChild(el('span', { html: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>' }));
        return s;
      })(),
      el('input', { class: 'input', placeholder: 'Search by customer, company, or quote #', oninput: (e) => { search = e.target.value; renderList(); } }),
    ]);
    filterRow.appendChild(search_);

    const statusSelect = el(
      'select',
      { class: 'select', style: { width: '160px' }, onchange: (e) => { statusFilter = e.target.value; renderList(); } },
      ['All', ...STATUSES].map((s) => el('option', { value: s }, s === 'All' ? 'All Statuses' : s)),
    );
    filterRow.appendChild(statusSelect);

    const memberSelect = el(
      'select',
      { class: 'select', style: { width: '180px' }, onchange: (e) => { memberFilter = e.target.value; renderList(); } },
      members.map((m) => el('option', { value: m }, m === 'All' ? 'All Team Members' : m)),
    );
    filterRow.appendChild(memberSelect);
  }

  function renderList() {
    listRoot.innerHTML = '';
    const filtered = quotes.filter((q) => {
      const s = search.toLowerCase();
      const matchesSearch = !s || q.customer?.name?.toLowerCase().includes(s) || q.quoteNumber?.toLowerCase().includes(s) || (q.customer?.company || '').toLowerCase().includes(s);
      const matchesStatus = statusFilter === 'All' || q.status === statusFilter;
      const matchesMember = memberFilter === 'All' || q.createdBy?.name === memberFilter;
      return matchesSearch && matchesStatus && matchesMember;
    });

    if (filtered.length === 0) {
      listRoot.appendChild(emptyState({ iconName: 'fileText', title: 'No quotes found', description: 'Try a different search or filter.' }));
      return;
    }

    const grid = el('div', { class: 'grid-cards' });
    for (const q of filtered) grid.appendChild(renderQuoteCard(q, navigate, () => {}));
    listRoot.appendChild(grid);
  }

  return wrapper;
}

function renderQuoteCard(q, navigate, onChanged) {
  const c = card({
    interactive: true,
    className: 'quote-card',
    onClick: () => navigate(`/dashboard/${q.id}`),
    children: [
      el('div', { class: 'quote-card-top' }, [
        el('div', { style: { minWidth: 0 } }, [
          el('p', { class: 'text-body-md' }, q.customer?.name || 'Untitled'),
          q.customer?.company ? el('p', { class: 'text-caption', style: { marginTop: '2px' } }, q.customer.company) : null,
        ]),
        statusBadge(q.status),
      ]),
      el('p', { class: 'quote-card-value' }, formatINR(q.total)),
      el('div', { class: 'quote-card-meta' }, [el('span', {}, q.quoteNumber), el('span', {}, formatDate(q.createdAt))]),
      el('p', { class: 'text-caption', style: { marginTop: '4px' } }, `by ${q.createdBy?.name || 'Team'}`),
      el('div', { class: 'row', style: { gap: '4px', marginTop: '12px', justifyContent: 'flex-end' } }, [
        iconButton({
          iconName: 'copy', size: 'sm', variant: 'ghost', ariaLabel: 'Duplicate',
          onClick: async (e) => { e.stopPropagation(); await duplicateQuote(q); toast('Quote duplicated', 'success'); onChanged(); },
        }),
        iconButton({
          iconName: 'pencil', size: 'sm', variant: 'ghost', ariaLabel: 'Edit',
          onClick: (e) => { e.stopPropagation(); loadQuoteIntoDraft(q); navigate('/quote'); },
        }),
        iconButton({
          iconName: 'trash', size: 'sm', variant: 'ghost', ariaLabel: 'Delete',
          onClick: async (e) => {
            e.stopPropagation();
            const ok = await confirmDialog({ title: `Delete quote ${q.quoteNumber}?`, message: 'This cannot be undone.', confirmLabel: 'Delete', danger: true });
            if (ok) { await deleteQuote(q.id); toast('Quote deleted', 'success'); onChanged(); }
          },
        }),
      ]),
    ],
  });
  return c;
}

/* ============================== Quote detail ============================== */

export function renderQuoteDetailView(navigate, id) {
  const wrapper = el('div', { style: { maxWidth: '620px', margin: '0 auto' } });
  wrapper.appendChild(spinner(true));

  getQuoteById(id).then((quote) => {
    wrapper.innerHTML = '';
    if (!quote) {
      wrapper.appendChild(el('h1', { class: 'heading-page' }, 'Quote not found'));
      wrapper.appendChild(button({ label: 'Back to Dashboard', onClick: () => navigate('/dashboard') }));
      return;
    }

    let updating = false;
    let downloading = false;

    const headerRow = el('div', { class: 'row', style: { gap: '12px', marginBottom: '20px' } }, [
      iconButton({ iconName: 'arrowLeft', variant: 'secondary', onClick: () => navigate(-1), ariaLabel: 'Back' }),
      el('div', { style: { flex: 1 } }, [
        el('h1', { class: 'heading-page' }, quote.quoteNumber),
        el('p', { class: 'text-secondary text-caption' }, `${quote.divisionName} · ${formatDate(quote.createdAt)}`),
      ]),
      statusBadge(quote.status),
    ]);
    wrapper.appendChild(headerRow);

    wrapper.appendChild(
      card({
        children: [
          el('p', { class: 'text-eyebrow', style: { marginBottom: '10px' } }, 'Customer'),
          el('p', { class: 'text-body-md' }, quote.customer?.name),
          el('p', { class: 'text-caption', style: { marginTop: '2px' } }, quote.customer?.phone),
          quote.customer?.company ? el('p', { class: 'text-caption' }, quote.customer.company) : null,
        ],
      }),
    );

    wrapper.appendChild(
      card({
        children: [
          el('p', { class: 'text-eyebrow' }, 'Services'),
          ...quote.items.map((item) =>
            el('div', { class: 'quote-line' }, [
              el('div', {}, [
                el('p', { class: 'text-body-md' }, [item.name, item.quantity > 1 ? el('span', { class: 'text-secondary' }, ` × ${item.quantity}`) : null]),
                el('p', { class: 'text-caption', style: { marginTop: '2px' } }, [item.categoryName, item.businessTypeName].filter(Boolean).join(' · ')),
              ]),
              el('p', { class: 'text-price' }, formatINR(item.lineTotal)),
            ]),
          ),
        ],
      }),
    );

    wrapper.appendChild(
      card({
        children: [
          totalsRow('Subtotal', formatINR(quote.subtotal)),
          quote.discount?.amount > 0 ? totalsRow('Discount', `− ${formatINR(quote.discount.amount)}`) : null,
          quote.annualTotal > 0 ? totalsRow('Annual Charges', formatINR(quote.annualTotal)) : null,
          quote.gst?.enabled ? totalsRow(`GST (${quote.gst.rate}%)`, formatINR(quote.gst.amount)) : null,
          el('div', { class: 'totals-row grand' }, [el('span', { class: 'heading-section' }, 'Grand Total'), el('span', { class: 'heading-lg' }, formatINR(quote.total))]),
        ],
      }),
    );

    const statusCard = card({ children: [el('p', { class: 'text-eyebrow', style: { marginBottom: '12px' } }, 'Status')] });
    const statusButtons = el('div', { class: 'row', style: { gap: '8px', flexWrap: 'wrap' } });
    for (const s of STATUSES) {
      statusButtons.appendChild(
        el(
          'button',
          {
            class: `tab-pill${quote.status === s ? ' is-active' : ''}`,
            disabled: updating,
            onClick: async () => {
              updating = true;
              await updateQuoteStatus(quote.id, s);
              quote.status = s;
              headerRow.replaceChild(statusBadge(quote.status), headerRow.lastChild);
              statusButtons.querySelectorAll('.tab-pill').forEach((el2, i) => el2.classList.toggle('is-active', STATUSES[i] === s));
              updating = false;
            },
          },
          s,
        ),
      );
    }
    statusCard.appendChild(statusButtons);
    wrapper.appendChild(statusCard);

    wrapper.appendChild(
      el('div', { class: 'grid-2', style: { gap: '10px' } }, [
        button({
          label: 'Duplicate', variant: 'secondary', size: 'lg', full: true, icon: 'copy',
          onClick: async () => {
            const copy = await duplicateQuote(quote);
            toast('Quote duplicated', 'success');
            navigate(`/dashboard/${copy.id}`);
          },
        }),
        button({
          label: 'Edit', variant: 'secondary', size: 'lg', full: true, icon: 'pencil',
          onClick: () => { loadQuoteIntoDraft(quote); navigate('/quote'); },
        }),
      ]),
    );

    wrapper.appendChild(
      button({
        label: 'Download PDF', size: 'lg', full: true, icon: 'download', loading: downloading,
        onClick: async () => {
          downloading = true;
          try {
            const company = await getCompanySettings();
            generateQuotePdf(quote, company);
          } finally {
            downloading = false;
          }
        },
      }),
    );

    wrapper.appendChild(
      el('div', { style: { marginTop: '10px' } }, [
        button({
          label: 'Delete Quote', variant: 'danger', size: 'lg', full: true, icon: 'trash',
          onClick: async () => {
            const ok = await confirmDialog({ title: `Delete quote ${quote.quoteNumber}?`, message: 'This cannot be undone.', confirmLabel: 'Delete', danger: true });
            if (ok) { await deleteQuote(quote.id); toast('Quote deleted', 'success'); navigate('/dashboard'); }
          },
        }),
      ]),
    );
  });

  return wrapper;
}

function totalsRow(label, value) {
  return el('div', { class: 'totals-row' }, [el('span', { class: 'text-secondary' }, label), el('span', { class: 'text-body-md' }, value)]);
}

/* ============================== Signed customers ============================== */

export function renderSignedCustomersView(navigate) {
  const wrapper = el('div', { class: 'animate-fade-up' });
  wrapper.appendChild(el('h1', { class: 'heading-page' }, 'Signed Customers'));
  const sub = el('p', { class: 'text-secondary text-caption', style: { marginTop: '4px', marginBottom: '20px' } }, '');
  wrapper.appendChild(sub);

  const listRoot = el('div', {}, [spinner(true)]);
  wrapper.appendChild(listRoot);

  const unsubscribe = listenQuotes((quotes) => {
    const signed = quotes.filter((q) => q.status === 'Signed' || q.status === 'Accepted');
    sub.textContent = `${signed.length} client${signed.length === 1 ? '' : 's'}`;
    listRoot.innerHTML = '';

    if (signed.length === 0) {
      listRoot.appendChild(emptyState({ iconName: 'users', title: 'No signed clients yet', description: 'Quotes marked Signed or Accepted will appear here as a lightweight client list.' }));
      return;
    }

    const grid = el('div', { class: 'grid-cards' });
    for (const q of signed) {
      grid.appendChild(
        card({
          interactive: true,
          onClick: () => navigate(`/dashboard/${q.id}`),
          children: [
            el('p', { class: 'text-body-md' }, q.customer?.name),
            el('p', { class: 'text-caption' }, q.customer?.phone),
            q.customer?.company ? el('p', { class: 'text-caption' }, q.customer.company) : null,
            el('p', { class: 'quote-card-value' }, formatINR(q.total)),
            el('p', { class: 'text-caption', style: { marginTop: '8px' } }, (q.items || []).map((i) => i.name).join(', ')),
            el('p', { class: 'text-caption', style: { marginTop: '8px', color: 'var(--color-text-tertiary)' } }, `Purchased ${formatDate(q.updatedAt)}`),
          ],
        }),
      );
    }
    listRoot.appendChild(grid);
  });
  wrapper.cleanup = unsubscribe;

  return wrapper;
}
