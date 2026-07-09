// pdf.js — premium branded quotation PDF, drawn with jsPDF (vendored UMD, global window.jspdf).
// Pure function of (quote, companySettings) — no Firestore access here.

const PAGE_W = 595.28; // A4 pt
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

const INK = [10, 10, 10];
const PAPER = [255, 255, 255];
const GRAY = [138, 138, 138];
const LINE = [225, 225, 225];

export function generateQuotePdf(quote, company) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  let y = 0;

  function newPage() {
    doc.addPage();
    y = MARGIN;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    doc.text(`${company.name || 'Kode31'} — Quotation ${quote.quoteNumber} (continued)`, MARGIN, y);
    y += 24;
  }

  function ensureSpace(height) {
    if (y + height > PAGE_H - 90) newPage();
  }

  // ---- Header band ----
  doc.setFillColor(...INK);
  doc.rect(0, 0, PAGE_W, 96, 'F');
  doc.setTextColor(...PAPER);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text((company.name || 'KODE31').toUpperCase(), MARGIN, 44);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text(`${quote.divisionName || ''} Studio Quotation`, MARGIN, 62);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(170, 170, 170);
  doc.text('QUOTE NUMBER', PAGE_W - MARGIN, 32, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...PAPER);
  doc.text(quote.quoteNumber, PAGE_W - MARGIN, 48, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(190, 190, 190);
  doc.text(formatDate(quote.createdAt), PAGE_W - MARGIN, 64, { align: 'right' });

  y = 96 + 40;

  // ---- Billed to / prepared by ----
  const colW = CONTENT_W / 2;
  eyebrow('BILLED TO', MARGIN, y);
  eyebrow('PREPARED BY', MARGIN + colW, y, 'right', MARGIN + CONTENT_W);
  y += 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...INK);
  doc.text(quote.customer?.name || '', MARGIN, y);
  doc.text(quote.createdBy?.name || '', MARGIN + CONTENT_W, y, { align: 'right' });
  y += 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...GRAY);
  doc.text(quote.customer?.phone || '', MARGIN, y);
  doc.text(company.name || '', MARGIN + CONTENT_W, y, { align: 'right' });
  if (quote.customer?.company) {
    y += 13;
    doc.text(quote.customer.company, MARGIN, y);
  }
  y += 30;

  // ---- Services ----
  eyebrow('SELECTED SERVICES', MARGIN, y);
  y += 18;

  for (const item of quote.items) {
    const includesLines = item.includes?.length ? wrapChips(doc, item.includes, CONTENT_W - 10) : [];
    const upgradeCount = item.selectedUpgrades?.length || 0;
    const annualCount = item.annualCharges?.filter((c) => c.included).length || 0;
    const blockHeight = 40 + includesLines.length * 16 + (upgradeCount + annualCount) * 14 + 16;
    ensureSpace(blockHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(...INK);
    const nameLine = item.quantity > 1 ? `${item.name}  ×${item.quantity}` : item.name;
    doc.text(nameLine, MARGIN, y);
    doc.text(formatINR(item.lineTotal), MARGIN + CONTENT_W, y, { align: 'right' });
    y += 14;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    const metaBits = [item.categoryName, item.businessTypeName, item.deliveryTime ? `Delivery: ${item.deliveryTime}` : null].filter(Boolean);
    if (metaBits.length) {
      doc.text(metaBits.join('  ·  '), MARGIN, y);
      y += 14;
    }

    for (const line of includesLines) {
      doc.setFontSize(8.5);
      doc.setTextColor(90, 90, 90);
      doc.text(line, MARGIN, y);
      y += 14;
    }

    for (const upg of item.selectedUpgrades || []) {
      doc.setFontSize(9);
      doc.setTextColor(70, 70, 70);
      doc.text(`+ ${upg.name}`, MARGIN, y);
      doc.text(formatINR(upg.price), MARGIN + CONTENT_W, y, { align: 'right' });
      y += 13;
    }

    for (const chg of (item.annualCharges || []).filter((c) => c.included)) {
      doc.setFontSize(9);
      doc.setTextColor(70, 70, 70);
      doc.text(`Annual · ${chg.name}`, MARGIN, y);
      doc.text(`${formatINR(chg.price)}/yr`, MARGIN + CONTENT_W, y, { align: 'right' });
      y += 13;
    }

    y += 6;
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
    y += 18;
  }

  // ---- Totals ----
  ensureSpace(150);
  const totalsW = 240;
  const totalsX = MARGIN + CONTENT_W - totalsW;
  totalRow(totalsX, 'Subtotal', formatINR(quote.subtotal));
  if (quote.discount?.amount > 0) {
    totalRow(totalsX, `Discount${quote.discount.type === 'percent' ? ` (${quote.discount.value}%)` : ''}`, `− ${formatINR(quote.discount.amount)}`);
  }
  if (quote.annualTotal > 0) totalRow(totalsX, 'Annual Charges', formatINR(quote.annualTotal));
  if (quote.gst?.enabled) totalRow(totalsX, `GST (${quote.gst.rate}%)`, formatINR(quote.gst.amount));

  y += 6;
  doc.setDrawColor(...INK);
  doc.setLineWidth(1);
  doc.line(totalsX, y, MARGIN + CONTENT_W, y);
  y += 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...INK);
  doc.text('Grand Total', totalsX, y);
  doc.setFontSize(16);
  doc.text(formatINR(quote.total), MARGIN + CONTENT_W, y, { align: 'right' });
  y += 40;

  // ---- Terms ----
  ensureSpace(90);
  const half = CONTENT_W / 2;
  eyebrow('PAYMENT TERMS', MARGIN, y);
  eyebrow('VALIDITY', MARGIN + half, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(60, 60, 60);
  wrapText(doc, quote.paymentTerms || 'As discussed.', MARGIN, y, half - 16).forEach((line, i) => doc.text(line, MARGIN, y + i * 13));
  wrapText(doc, `Valid for ${quote.validityDays} days from the date of issue.`, MARGIN + half, y, half - 8).forEach((line, i) =>
    doc.text(line, MARGIN + half, y + i * 13),
  );
  y += 40;

  if (company.gstNumber) {
    ensureSpace(20);
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text(`GSTIN: ${company.gstNumber}`, MARGIN, y);
    y += 16;
  }
  if (company.bankDetails?.accountNumber) {
    ensureSpace(30);
    eyebrow('BANK DETAILS', MARGIN, y);
    y += 14;
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const bd = company.bankDetails;
    doc.text(`${bd.accountName || ''} · ${bd.bankName || ''} · A/C ${bd.accountNumber || ''} · IFSC ${bd.ifsc || ''}`, MARGIN, y);
  }

  // ---- Footer on every page ----
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, PAGE_H - 64, PAGE_W - MARGIN, PAGE_H - 64);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    const footerLines = wrapText(doc, company.footerText || 'Thank you for choosing Kode31.', MARGIN, PAGE_H - 48, CONTENT_W);
    footerLines.slice(0, 2).forEach((line, i) => doc.text(line, PAGE_W / 2, PAGE_H - 48 + i * 11, { align: 'center' }));
    const contactLine = [company.address, company.phone, company.email, company.website].filter(Boolean).join('   ·   ');
    if (contactLine) doc.text(contactLine, PAGE_W / 2, PAGE_H - 24, { align: 'center' });
  }

  doc.save(`${quote.quoteNumber}.pdf`);

  function totalRow(x, label, value) {
    ensureSpace(18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...GRAY);
    doc.text(label, x, y);
    doc.setTextColor(...INK);
    doc.text(value, MARGIN + CONTENT_W, y, { align: 'right' });
    y += 16;
  }

  function eyebrow(text, x, yy) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text(text, x, yy, { charSpace: 0.6 });
  }
}

function formatINR(amount) {
  return `Rs. ${Math.round(amount || 0).toLocaleString('en-IN')}`;
}

function formatDate(ts) {
  if (!ts) return '';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(ts));
}

function wrapText(doc, text, x, y, maxWidth) {
  return doc.splitTextToSize(text, maxWidth);
}

function wrapChips(doc, chips, maxWidth) {
  const text = chips.join('   •   ');
  doc.setFontSize(8.5);
  return doc.splitTextToSize(text, maxWidth);
}
