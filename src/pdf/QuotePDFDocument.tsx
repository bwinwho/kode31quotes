import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';
import type { CompanySettings, Quote } from '@/types';

Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    paddingBottom: 90,
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: '#1a1a24',
  },
  headerBand: {
    paddingHorizontal: 40,
    paddingVertical: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: { width: 34, height: 34, borderRadius: 8 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandName: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: '#ffffff', letterSpacing: 0.5 },
  brandSub: { fontSize: 8, color: '#c9c3ff', marginTop: 2 },
  quoteMeta: { alignItems: 'flex-end' },
  quoteLabel: { fontSize: 8, color: '#c9c3ff' },
  quoteNumber: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#ffffff', marginTop: 2 },
  body: { paddingHorizontal: 40, paddingTop: 24 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 },
  infoBlock: { width: '48%' },
  infoTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#8a8aa3', letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' },
  infoText: { fontSize: 10.5, color: '#1a1a24', marginBottom: 2 },
  infoTextMuted: { fontSize: 9, color: '#666677', marginBottom: 2 },
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#8a8aa3', letterSpacing: 1, marginBottom: 8, marginTop: 4, textTransform: 'uppercase' },
  item: { marginBottom: 14, paddingBottom: 14, borderBottomWidth: 0.5, borderBottomColor: '#e4e4ec' },
  itemHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemName: { fontSize: 11.5, fontFamily: 'Helvetica-Bold', color: '#1a1a24' },
  itemMeta: { fontSize: 8.5, color: '#8a8aa3', marginTop: 2 },
  itemPrice: { fontSize: 11.5, fontFamily: 'Helvetica-Bold', color: '#1a1a24' },
  includesRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 6 },
  chip: { fontSize: 8, color: '#4b4b63', backgroundColor: '#f2f1fa', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, marginRight: 4, marginTop: 4 },
  upgradeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  upgradeText: { fontSize: 9, color: '#4b4b63' },
  totalsBlock: { marginTop: 10, alignSelf: 'flex-end', width: 260 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalLabel: { fontSize: 9.5, color: '#666677' },
  totalValue: { fontSize: 9.5, color: '#1a1a24' },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1a1a24' },
  grandLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#1a1a24' },
  grandValue: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: '#6a4bf5' },
  termsBlock: { marginTop: 26, flexDirection: 'row', gap: 24 },
  termsCol: { flex: 1 },
  termsText: { fontSize: 9, color: '#4b4b63', lineHeight: 1.5 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 40, paddingVertical: 18, borderTopWidth: 0.5, borderTopColor: '#e4e4ec' },
  footerText: { fontSize: 8, color: '#8a8aa3', lineHeight: 1.5, textAlign: 'center' },
  footerCompany: { fontSize: 8, color: '#8a8aa3', textAlign: 'center', marginTop: 4 },
});

export function QuotePDFDocument({ quote, company }: { quote: Quote; company: CompanySettings }) {
  const primary = company.pdfTheme?.primaryColor || '#0b0b12';
  const accent = company.pdfTheme?.accentColor || '#6a4bf5';

  return (
    <Document title={`${quote.quoteNumber} — ${company.name}`}>
      <Page size="A4" style={styles.page}>
        <View style={[styles.headerBand, { backgroundColor: primary }]}>
          <View style={styles.brandRow}>
            {company.logoUrl ? (
              <Image src={company.logoUrl} style={styles.logo} />
            ) : (
              <View style={[styles.logo, { backgroundColor: accent, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ color: '#fff', fontSize: 15, fontFamily: 'Helvetica-Bold' }}>
                  {company.name?.slice(0, 1) || 'K'}
                </Text>
              </View>
            )}
            <View>
              <Text style={styles.brandName}>{company.name || 'Kode31'}</Text>
              <Text style={styles.brandSub}>{quote.divisionName} Studio Quotation</Text>
            </View>
          </View>
          <View style={styles.quoteMeta}>
            <Text style={styles.quoteLabel}>QUOTE NUMBER</Text>
            <Text style={styles.quoteNumber}>{quote.quoteNumber}</Text>
            <Text style={[styles.quoteLabel, { marginTop: 6 }]}>{formatDate(quote.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.infoRow}>
            <View style={styles.infoBlock}>
              <Text style={styles.infoTitle}>Billed To</Text>
              <Text style={styles.infoText}>{quote.customer.name}</Text>
              <Text style={styles.infoTextMuted}>{quote.customer.phone}</Text>
              {quote.customer.company && <Text style={styles.infoTextMuted}>{quote.customer.company}</Text>}
            </View>
            <View style={[styles.infoBlock, { alignItems: 'flex-end' }]}>
              <Text style={styles.infoTitle}>Prepared By</Text>
              <Text style={styles.infoText}>{quote.createdBy.name}</Text>
              <Text style={styles.infoTextMuted}>{company.name}</Text>
              {company.email && <Text style={styles.infoTextMuted}>{company.email}</Text>}
            </View>
          </View>

          <Text style={styles.sectionTitle}>Selected Services</Text>
          {quote.items.map((item) => (
            <View key={item.serviceId} style={styles.item} wrap={false}>
              <View style={styles.itemHeaderRow}>
                <View style={{ maxWidth: '70%' }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemMeta}>
                    {[item.categoryName, item.businessTypeName].filter(Boolean).join(' · ')}
                    {item.deliveryTime ? `  ·  Delivery: ${item.deliveryTime}` : ''}
                    {item.quantity > 1 ? `  ·  Qty: ${item.quantity}${item.bundleLabel ? ` (${item.bundleLabel})` : ''}` : ''}
                  </Text>
                </View>
                <Text style={styles.itemPrice}>{formatINR(item.lineTotal)}</Text>
              </View>

              {item.includes.length > 0 && (
                <View style={styles.includesRow}>
                  {item.includes.map((inc) => (
                    <Text key={inc} style={styles.chip}>
                      {inc}
                    </Text>
                  ))}
                </View>
              )}

              {item.selectedUpgrades.map((u) => (
                <View key={u.id} style={styles.upgradeRow}>
                  <Text style={styles.upgradeText}>+ {u.name}</Text>
                  <Text style={styles.upgradeText}>{formatINR(u.price)}</Text>
                </View>
              ))}

              {item.annualCharges.filter((c) => c.included).map((c) => (
                <View key={c.id} style={styles.upgradeRow}>
                  <Text style={styles.upgradeText}>Annual · {c.name}</Text>
                  <Text style={styles.upgradeText}>{formatINR(c.price)}/yr</Text>
                </View>
              ))}
            </View>
          ))}

          <View style={styles.totalsBlock}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatINR(quote.subtotal)}</Text>
            </View>
            {quote.discount.amount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  Discount {quote.discount.type === 'percent' ? `(${quote.discount.value}%)` : ''}
                </Text>
                <Text style={styles.totalValue}>− {formatINR(quote.discount.amount)}</Text>
              </View>
            )}
            {quote.annualTotal > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Annual Charges</Text>
                <Text style={styles.totalValue}>{formatINR(quote.annualTotal)}</Text>
              </View>
            )}
            {quote.gst.enabled && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>GST ({quote.gst.rate}%)</Text>
                <Text style={styles.totalValue}>{formatINR(quote.gst.amount)}</Text>
              </View>
            )}
            <View style={styles.grandRow}>
              <Text style={styles.grandLabel}>Grand Total</Text>
              <Text style={[styles.grandValue, { color: accent }]}>{formatINR(quote.total)}</Text>
            </View>
          </View>

          <View style={styles.termsBlock}>
            <View style={styles.termsCol}>
              <Text style={styles.sectionTitle}>Payment Terms</Text>
              <Text style={styles.termsText}>{quote.paymentTerms || 'As discussed.'}</Text>
            </View>
            <View style={styles.termsCol}>
              <Text style={styles.sectionTitle}>Validity</Text>
              <Text style={styles.termsText}>This quotation is valid for {quote.validityDays} days from the date of issue.</Text>
            </View>
          </View>

          {company.gstNumber && (
            <Text style={[styles.termsText, { marginTop: 14 }]}>GSTIN: {company.gstNumber}</Text>
          )}
          {company.bankDetails?.accountNumber && (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.sectionTitle}>Bank Details</Text>
              <Text style={styles.termsText}>
                {company.bankDetails.accountName} · {company.bankDetails.bankName} · A/C {company.bankDetails.accountNumber} · IFSC{' '}
                {company.bankDetails.ifsc}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{company.footerText}</Text>
          <Text style={styles.footerCompany}>
            {[company.address, company.phone, company.email, company.website].filter(Boolean).join('  ·  ')}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

function formatINR(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString('en-IN')}`;
}

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(ts));
}
