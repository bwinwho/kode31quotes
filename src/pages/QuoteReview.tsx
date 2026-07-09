import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuoteStore } from '@/store/quoteStore';
import { useAuth } from '@/context/AuthContext';
import { useCompanySettings } from '@/hooks/useQuotes';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Toggle';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatINR, generateQuoteNumber } from '@/lib/utils';
import { createQuote } from '@/lib/firestoreService';
import { downloadQuotePdf } from '@/pdf/generatePdf';
import type { Quote } from '@/types';

export default function QuoteReview() {
  const navigate = useNavigate();
  const { appUser } = useAuth();
  const { settings } = useCompanySettings();
  const state = useQuoteStore();
  const { division, customer, items, discount, gstEnabled, gstRate, paymentTerms, validityDays, notes } = state;

  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [savedQuote, setSavedQuote] = useState<Quote | null>(null);

  if (!division || !customer) {
    navigate('/', { replace: true });
    return null;
  }

  const subtotal = state.subtotal();
  const discountAmount = state.discountAmount();
  const annualTotal = state.annualTotal();
  const gstAmount = state.gstAmount();
  const grandTotal = state.grandTotal();

  const buildQuote = (): Quote => ({
    id: savedQuote?.id ?? crypto.randomUUID(),
    quoteNumber: savedQuote?.quoteNumber ?? generateQuoteNumber(),
    divisionId: division.id,
    divisionName: division.name,
    customer,
    items,
    annualTotal,
    subtotal,
    discount: { ...discount, amount: discountAmount },
    gst: { enabled: gstEnabled, rate: gstRate, amount: gstAmount },
    total: grandTotal,
    status: 'Draft',
    paymentTerms: paymentTerms || settings?.paymentTermsDefault || '50% advance, balance on delivery.',
    validityDays: validityDays || settings?.validityDaysDefault || 15,
    notes,
    createdBy: { uid: appUser?.uid ?? '', name: appUser?.name ?? 'Team Member' },
    createdAt: savedQuote?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const quote = buildQuote();
      await createQuote(quote);
      setSavedQuote(quote);
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!settings) return;
    setDownloading(true);
    try {
      const quote = savedQuote ?? buildQuote();
      await downloadQuotePdf(quote, settings);
    } finally {
      setDownloading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md">
        <PageHeader title="Review Quote" onBack />
        <EmptyState
          icon="🧺"
          title="No services selected yet"
          description="Head back and add services to build this client's quote."
          action={<Button onClick={() => navigate(division.id === 'universe' ? '/universe' : '/multiverse')}>Add Services</Button>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-up pb-20">
      <PageHeader title="Review Quote" subtitle={`${division.name} · ${customer.name}`} onBack />

      <div className="mt-4 flex flex-col gap-4">
        <Card className="p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-base-400">Customer</p>
          <p className="text-base font-semibold text-base-50">{customer.name}</p>
          <p className="text-sm text-base-400">{customer.phone}</p>
          {customer.company && <p className="text-sm text-base-400">{customer.company}</p>}
        </Card>

        <Card className="p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-base-400">Selected Services</p>
          <div className="flex flex-col divide-y divide-base-700/60">
            {items.map((item) => (
              <div key={item.serviceId} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-base-50">
                      {item.name}
                      {item.quantity > 1 && <span className="ml-1.5 text-sm text-base-400">× {item.quantity}</span>}
                    </p>
                    <p className="mt-0.5 text-xs text-base-400">
                      {[item.categoryName, item.businessTypeName].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold text-base-100">{formatINR(item.lineTotal)}</p>
                </div>
                {item.includes.length > 0 && (
                  <p className="mt-2 text-xs text-base-400">Includes: {item.includes.join(', ')}</p>
                )}
                {item.selectedUpgrades.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.selectedUpgrades.map((u) => (
                      <span key={u.id} className="rounded-full bg-base-800 px-2 py-0.5 text-[11px] text-base-300">
                        {u.name} +{formatINR(u.price)}
                      </span>
                    ))}
                  </div>
                )}
                {item.annualCharges.some((c) => c.included) && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.annualCharges
                      .filter((c) => c.included)
                      .map((c) => (
                        <span key={c.id} className="rounded-full bg-gold-500/10 px-2 py-0.5 text-[11px] text-gold-400">
                          {c.name} {formatINR(c.price)}/yr
                        </span>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-base-400">Adjustments</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="mb-2 block text-sm font-medium text-base-200">Discount</span>
              <div className="flex gap-2">
                <select
                  value={discount.type}
                  onChange={(e) => state.setDiscount(e.target.value as 'flat' | 'percent', discount.value)}
                  className="h-11 rounded-xl border border-base-600 bg-base-900/60 px-2 text-sm text-base-100 outline-none focus:border-accent-500"
                >
                  <option value="flat">₹</option>
                  <option value="percent">%</option>
                </select>
                <input
                  type="number"
                  min={0}
                  value={discount.value || ''}
                  onChange={(e) => state.setDiscount(discount.type, Number(e.target.value) || 0)}
                  placeholder="0"
                  className="h-11 w-full rounded-xl border border-base-600 bg-base-900/60 px-3 text-sm text-base-100 outline-none focus:border-accent-500"
                />
              </div>
            </div>
            <div>
              <span className="mb-2 block text-sm font-medium text-base-200">GST</span>
              <div className="flex h-11 items-center justify-between rounded-xl border border-base-600 bg-base-900/60 px-3">
                <span className="text-sm text-base-300">{gstRate}%</span>
                <Switch checked={gstEnabled} onChange={(v) => state.setGst(v)} />
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Input
              label="Validity (days)"
              type="number"
              value={validityDays}
              onChange={(e) => state.setValidityDays(Number(e.target.value) || 0)}
            />
            <div>
              <span className="mb-2 block text-sm font-medium text-base-200">Payment Terms</span>
              <input
                value={paymentTerms}
                onChange={(e) => state.setPaymentTerms(e.target.value)}
                placeholder={settings?.paymentTermsDefault ?? '50% advance…'}
                className="h-[3.25rem] w-full rounded-2xl border border-base-600 bg-base-900/60 px-4 text-sm text-base-100 outline-none focus:border-accent-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <Textarea label="Notes (optional)" value={notes} onChange={(e) => state.setNotes(e.target.value)} placeholder="Anything specific to mention…" />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex flex-col gap-2">
            <Row label="Subtotal" value={formatINR(subtotal)} />
            {discountAmount > 0 && <Row label="Discount" value={`− ${formatINR(discountAmount)}`} />}
            {annualTotal > 0 && <Row label="Annual Charges" value={formatINR(annualTotal)} />}
            {gstEnabled && <Row label={`GST (${gstRate}%)`} value={formatINR(gstAmount)} />}
            <div className="mt-2 flex items-center justify-between border-t border-base-700 pt-3">
              <span className="font-display text-lg font-semibold text-base-50">Grand Total</span>
              <span className="font-display text-2xl font-semibold text-accent-300">{formatINR(grandTotal)}</span>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button size="lg" variant="secondary" loading={saving} onClick={() => void handleSave()}>
            {savedQuote ? 'Saved ✓' : 'Save Quote'}
          </Button>
          <Button size="lg" loading={downloading} onClick={() => void handleDownload()} disabled={!settings}>
            Download PDF
          </Button>
        </div>
        {savedQuote && (
          <Button variant="ghost" onClick={() => navigate(`/dashboard/${savedQuote.id}`)}>
            View in Dashboard →
          </Button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-base-400">{label}</span>
      <span className="font-medium text-base-200">{value}</span>
    </div>
  );
}
