// pdf.js — premium DARK branded quotation PDF, drawn with jsPDF (vendored UMD, global
// window.jspdf). Mirrors the on-screen bill (see renderBill in quotes.js). Pure function
// of (quote, companySettings) — no Firestore access here.

const PAGE_W = 595.28; // A4 pt
const PAGE_H = 841.89;
const MARGIN = 40;
const CW = PAGE_W - MARGIN * 2;

const BG = [10, 10, 12];
const CARD = [22, 22, 24];
const CARD2 = [26, 26, 28];
const BORDER = [44, 44, 48];
const BORDER2 = [58, 58, 64];
const WHITE = [255, 255, 255];
const GRAY = [150, 150, 156];
const FAINT = [104, 104, 110];

export function generateQuotePdf(quote, company) {
  const co = company || {};
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  let y = MARGIN;

  const setColor = (c) => doc.setTextColor(c[0], c[1], c[2]);
  const fillPage = () => {
    doc.setFillColor(...BG);
    doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  };
  const card = (x, yy, w, h, fill = CARD) => {
    doc.setFillColor(...fill);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.6);
    doc.roundedRect(x, yy, w, h, 9, 9, 'FD');
  };
  const newPage = () => {
    doc.addPage();
    fillPage();
    y = MARGIN;
  };
  const ensure = (h) => { if (y + h > PAGE_H - MARGIN) newPage(); };
  const eyebrow = (text, x, yy, align = 'left') => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    setColor(FAINT);
    doc.text(text, x, yy, { align, charSpace: 0.8 });
  };

  fillPage();

  // ---------- Header ----------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(23);
  setColor(WHITE);
  doc.text((co.name || 'KODE31').toUpperCase(), MARGIN, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setColor(GRAY);
  doc.text(`${quote.divisionName || ''} Studio Quotation`, MARGIN, y + 36);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  setColor(FAINT);
  doc.text('QUOTE NUMBER', PAGE_W - MARGIN, y + 8, { align: 'right', charSpace: 0.8 });
  doc.setFontSize(13);
  setColor(WHITE);
  doc.text(quote.quoteNumber, PAGE_W - MARGIN, y + 24, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setColor(GRAY);
  doc.text(formatDate(quote.createdAt), PAGE_W - MARGIN, y + 39, { align: 'right' });

  y += 54;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 20;

  // ---------- Parties ----------
  const gap = 14;
  const pw = (CW - gap) / 2;
  const partyH = 74;
  card(MARGIN, y, pw, partyH);
  card(MARGIN + pw + gap, y, pw, partyH);

  eyebrow('BILLED TO', MARGIN + 16, y + 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  setColor(WHITE);
  doc.text(quote.customer?.name || '—', MARGIN + 16, y + 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setColor(GRAY);
  doc.text(quote.customer?.phone || '', MARGIN + 16, y + 55);
  if (quote.customer?.company) doc.text(quote.customer.company, MARGIN + 16, y + 67);

  const rx = MARGIN + pw + gap + pw - 16;
  eyebrow('PREPARED BY', rx, y + 20, 'right');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  setColor(WHITE);
  doc.text(quote.createdBy?.name || co.name || 'Kode31', rx, y + 40, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setColor(GRAY);
  doc.text(co.name || 'Kode31', rx, y + 55, { align: 'right' });
  if (co.email) doc.text(co.email, rx, y + 67, { align: 'right' });

  y += partyH + 18;

  // ---------- Services ----------
  eyebrow('SELECTED SERVICES', MARGIN, y);
  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  setColor(FAINT);
  doc.text('SERVICE & DETAILS', MARGIN, y, { charSpace: 0.6 });
  doc.text('PRICE', PAGE_W - MARGIN, y, { align: 'right', charSpace: 0.6 });
  y += 8;
  doc.setDrawColor(...BORDER);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 18;

  quote.items.forEach((item, idx) => {
    const chips = item.includes?.length ? doc.splitTextToSize(item.includes.join('   ·   '), CW - 120) : [];
    const subs = [...(item.selectedUpgrades || []).map((u) => [`+ ${u.name}`, money(u.price)]),
      ...(item.annualCharges || []).filter((c) => c.included).map((c) => [`Annual · ${c.name}`, `${money(c.price)}/yr`])];
    const blockH = 30 + chips.length * 11 + subs.length * 13 + 14;
    ensure(blockH);

    if (idx > 0) {
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.5);
      doc.line(MARGIN, y - 10, PAGE_W - MARGIN, y - 10);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    setColor(WHITE);
    doc.text(item.quantity > 1 ? `${item.name}   ×${item.quantity}` : item.name, MARGIN, y);
    doc.text(money(item.lineTotal), PAGE_W - MARGIN, y, { align: 'right' });
    y += 14;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    setColor(GRAY);
    const meta = [item.categoryName, item.businessTypeName, item.deliveryTime ? `Delivery: ${item.deliveryTime}` : null].filter(Boolean).join('   ·   ');
    if (meta) { doc.text(meta, MARGIN, y); y += 13; }

    chips.forEach((line) => { setColor(FAINT); doc.setFontSize(8.5); doc.text(line, MARGIN, y); y += 11; });
    subs.forEach(([l, r]) => {
      doc.setFontSize(8.5); setColor(GRAY);
      doc.text(l, MARGIN, y);
      doc.text(r, PAGE_W - MARGIN, y, { align: 'right' });
      y += 13;
    });
    y += 14;
  });

  // ---------- Totals box ----------
  const boxW = 250;
  const rows = [['Subtotal', money(quote.subtotal)]];
  if (quote.discount?.amount > 0) rows.push([`Discount${quote.discount.type === 'percent' ? ` (${quote.discount.value}%)` : ''}`, `- ${money(quote.discount.amount)}`]);
  if (quote.annualTotal > 0) rows.push(['Annual charges', money(quote.annualTotal)]);
  if (quote.gst?.enabled) rows.push([`GST (${quote.gst.rate}%)`, money(quote.gst.amount)]);
  const boxH = 30 + rows.length * 16 + 46;
  ensure(boxH);
  const boxX = PAGE_W - MARGIN - boxW;
  card(boxX, y, boxW, boxH, CARD2);
  let by = y + 24;
  rows.forEach(([l, r]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    setColor(GRAY);
    doc.text(l, boxX + 16, by);
    setColor(WHITE);
    doc.text(r, boxX + boxW - 16, by, { align: 'right' });
    by += 16;
  });
  by += 4;
  doc.setDrawColor(...BORDER2);
  doc.line(boxX + 16, by, boxX + boxW - 16, by);
  by += 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  setColor(WHITE);
  doc.text('Grand Total', boxX + 16, by);
  doc.setFontSize(17);
  doc.text(money(quote.total), boxX + boxW - 16, by + 1, { align: 'right' });
  by += 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setColor(FAINT);
  doc.text(quote.gst?.enabled ? 'Inclusive of applicable taxes' : 'Taxes as applicable', boxX + 16, by);
  y += boxH + 20;

  // ---------- Terms ----------
  const termH = 72;
  ensure(termH);
  card(MARGIN, y, pw, termH);
  card(MARGIN + pw + gap, y, pw, termH);
  eyebrow('PAYMENT TERMS', MARGIN + 16, y + 20);
  eyebrow('VALIDITY', MARGIN + pw + gap + 16, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  setColor(GRAY);
  doc.splitTextToSize(quote.paymentTerms || 'As discussed.', pw - 32).slice(0, 3).forEach((l, i) => doc.text(l, MARGIN + 16, y + 38 + i * 13));
  doc.splitTextToSize(`Valid for ${quote.validityDays} days from the date of issue.`, pw - 32).slice(0, 3).forEach((l, i) => doc.text(l, MARGIN + pw + gap + 16, y + 38 + i * 13));
  y += termH + 18;

  // ---------- Footer card ----------
  const footH = 78;
  ensure(footH);
  card(MARGIN, y, CW, footH);
  // K31 circle
  const cx = MARGIN + 40;
  const cy = y + footH / 2;
  doc.setDrawColor(...BORDER2);
  doc.setLineWidth(1);
  doc.circle(cx, cy, 22, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  setColor(WHITE);
  doc.text('K31', cx, cy + 4, { align: 'center' });
  // divider
  doc.setDrawColor(...BORDER);
  doc.line(MARGIN + 76, y + 16, MARGIN + 76, y + footH - 16);
  // thank-you text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setColor(GRAY);
  doc.splitTextToSize(co.footerText || 'Thank you for choosing Kode31. This quotation is generated digitally and does not require a signature.', CW - 300).slice(0, 3).forEach((l, i) => doc.text(l, MARGIN + 92, y + 30 + i * 13));
  // signature
  const sx = PAGE_W - MARGIN - 20;
  doc.setDrawColor(...BORDER2);
  doc.setLineWidth(0.8);
  doc.lines([[10, -8], [10, 10], [10, -12], [10, 8]], sx - 84, y + 30, [1, 1], 'S');
  doc.line(sx - 90, y + 42, sx, y + 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  setColor(WHITE);
  doc.text(quote.createdBy?.name || co.name || 'Kode31', sx, y + 56, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  setColor(GRAY);
  doc.text(co.name || 'Kode31', sx, y + 68, { align: 'right' });

  // GST / bank line (optional, below footer)
  if (co.gstNumber || co.bankDetails?.accountNumber) {
    y += footH + 14;
    ensure(20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setColor(FAINT);
    const bd = co.bankDetails || {};
    const bits = [];
    if (co.gstNumber) bits.push(`GSTIN: ${co.gstNumber}`);
    if (bd.accountNumber) bits.push(`${bd.bankName || ''} A/C ${bd.accountNumber} · IFSC ${bd.ifsc || ''}`);
    doc.text(bits.join('     ·     '), MARGIN, y, { maxWidth: CW });
  }

  doc.save(`${quote.quoteNumber}.pdf`);
}

function money(amount) {
  return `Rs. ${Math.round(amount || 0).toLocaleString('en-IN')}`;
}

function formatDate(ts) {
  if (!ts) return '';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(ts));
}
