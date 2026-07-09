import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getQuoteById, updateQuoteStatus } from '@/lib/firestoreService';
import { useCompanySettings } from '@/hooks/useQuotes';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate, formatINR } from '@/lib/utils';
import { downloadQuotePdf } from '@/pdf/generatePdf';
import type { Quote, QuoteStatus } from '@/types';

const STATUSES: QuoteStatus[] = ['Draft', 'Sent', 'Signed', 'Accepted', 'Rejected'];

export default function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { settings } = useCompanySettings();
  const [quote, setQuote] = useState<Quote | null | undefined>(undefined);
  const [downloading, setDownloading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    getQuoteById(id).then(setQuote);
  }, [id]);

  const handleStatusChange = async (status: QuoteStatus) => {
    if (!quote) return;
    setUpdating(true);
    try {
      await updateQuoteStatus(quote.id, status);
      setQuote({ ...quote, status });
    } finally {
      setUpdating(false);
    }
  };

  if (quote === undefined) return <Spinner className="py-24" />;
  if (quote === null) {
    return (
      <div className="mx-auto max-w-md">
        <PageHeader title="Quote not found" onBack />
        <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-up pb-20">
      <PageHeader
        title={quote.quoteNumber}
        subtitle={`${quote.divisionName} · ${formatDate(quote.createdAt)}`}
        onBack
        action={<StatusBadge status={quote.status} />}
      />

      <div className="mt-4 flex flex-col gap-4">
        <Card className="p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-base-400">Customer</p>
          <p className="text-base font-semibold text-base-50">{quote.customer.name}</p>
          <p className="text-sm text-base-400">{quote.customer.phone}</p>
          {quote.customer.company && <p className="text-sm text-base-400">{quote.customer.company}</p>}
        </Card>

        <Card className="p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-base-400">Services</p>
          <div className="flex flex-col divide-y divide-base-700/60">
            {quote.items.map((item) => (
              <div key={item.serviceId} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-base-50">
                    {item.name}
                    {item.quantity > 1 && <span className="ml-1.5 text-sm text-base-400">× {item.quantity}</span>}
                  </p>
                  <p className="font-semibold text-base-100">{formatINR(item.lineTotal)}</p>
                </div>
                <p className="mt-0.5 text-xs text-base-400">
                  {[item.categoryName, item.businessTypeName].filter(Boolean).join(' · ')}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-base-400">Subtotal</span>
              <span className="text-base-200">{formatINR(quote.subtotal)}</span>
            </div>
            {quote.discount.amount > 0 && (
              <div className="flex justify-between">
                <span className="text-base-400">Discount</span>
                <span className="text-base-200">− {formatINR(quote.discount.amount)}</span>
              </div>
            )}
            {quote.annualTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-base-400">Annual Charges</span>
                <span className="text-base-200">{formatINR(quote.annualTotal)}</span>
              </div>
            )}
            {quote.gst.enabled && (
              <div className="flex justify-between">
                <span className="text-base-400">GST ({quote.gst.rate}%)</span>
                <span className="text-base-200">{formatINR(quote.gst.amount)}</span>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between border-t border-base-700 pt-3">
              <span className="font-display text-lg font-semibold text-base-50">Grand Total</span>
              <span className="font-display text-2xl font-semibold text-accent-300">{formatINR(quote.total)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-base-400">Status</p>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                disabled={updating}
                onClick={() => void handleStatusChange(s)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  quote.status === s
                    ? 'border-accent-500 bg-accent-500/15 text-accent-300'
                    : 'border-base-600 text-base-300 hover:border-base-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Card>

        <Button
          size="lg"
          loading={downloading}
          disabled={!settings}
          onClick={async () => {
            if (!settings) return;
            setDownloading(true);
            try {
              await downloadQuotePdf(quote, settings);
            } finally {
              setDownloading(false);
            }
          }}
        >
          Download PDF
        </Button>
      </div>
    </div>
  );
}
