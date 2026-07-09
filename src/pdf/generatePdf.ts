import type { CompanySettings, Quote } from '@/types';

export async function downloadQuotePdf(quote: Quote, company: CompanySettings): Promise<void> {
  const [{ pdf }, { QuotePDFDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./QuotePDFDocument'),
  ]);
  const blob = await pdf(QuotePDFDocument({ quote, company })).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${quote.quoteNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
