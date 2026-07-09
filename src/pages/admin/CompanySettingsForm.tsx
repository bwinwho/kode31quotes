import { useEffect, useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { useCompanySettings } from '@/hooks/useQuotes';
import { saveCompanySettings } from '@/lib/firestoreService';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { CompanySettings } from '@/types';

const EMPTY: CompanySettings = {
  name: '',
  logoUrl: '',
  gstNumber: '',
  bankDetails: { accountName: '', accountNumber: '', ifsc: '', bankName: '' },
  footerText: '',
  paymentTermsDefault: '',
  validityDaysDefault: 15,
  address: '',
  phone: '',
  email: '',
  website: '',
  pdfTheme: { primaryColor: '#0b0b12', accentColor: '#7c5cfc' },
};

export function CompanySettingsForm() {
  const { settings, loading } = useCompanySettings();
  const [form, setForm] = useState<CompanySettings>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  if (loading) return null;

  const update = <K extends keyof CompanySettings>(key: K, value: CompanySettings[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };

  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    try {
      const storageRef = ref(storage, `branding/logo-${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      update('logoUrl', url);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveCompanySettings(form);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-base-400">Company Details</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Company Name" value={form.name} onChange={(e) => update('name', e.target.value)} />
          <Input label="GST Number" value={form.gstNumber} onChange={(e) => update('gstNumber', e.target.value)} />
          <Input label="Phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          <Input label="Email" value={form.email} onChange={(e) => update('email', e.target.value)} />
          <Input label="Website" value={form.website} onChange={(e) => update('website', e.target.value)} />
          <Input label="Address" value={form.address} onChange={(e) => update('address', e.target.value)} />
        </div>

        <div className="mt-4">
          <span className="mb-2 block text-sm font-medium text-base-200">Logo</span>
          <div className="flex items-center gap-4">
            {form.logoUrl ? (
              <img src={form.logoUrl} alt="Logo" className="size-14 rounded-xl border border-base-700 object-cover" />
            ) : (
              <div className="flex size-14 items-center justify-center rounded-xl border border-dashed border-base-600 text-xs text-base-500">
                None
              </div>
            )}
            <label className="cursor-pointer">
              <span className="inline-flex h-10 items-center rounded-xl border border-base-600 px-4 text-sm font-medium text-base-200 hover:border-base-400">
                {uploading ? 'Uploading…' : 'Upload Logo'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleLogoUpload(file);
                }}
              />
            </label>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-base-400">Bank Details</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Account Name"
            value={form.bankDetails.accountName}
            onChange={(e) => update('bankDetails', { ...form.bankDetails, accountName: e.target.value })}
          />
          <Input
            label="Bank Name"
            value={form.bankDetails.bankName}
            onChange={(e) => update('bankDetails', { ...form.bankDetails, bankName: e.target.value })}
          />
          <Input
            label="Account Number"
            value={form.bankDetails.accountNumber}
            onChange={(e) => update('bankDetails', { ...form.bankDetails, accountNumber: e.target.value })}
          />
          <Input
            label="IFSC"
            value={form.bankDetails.ifsc}
            onChange={(e) => update('bankDetails', { ...form.bankDetails, ifsc: e.target.value })}
          />
        </div>
      </Card>

      <Card className="p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-base-400">Quote Defaults</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Default Validity (days)"
            type="number"
            value={form.validityDaysDefault}
            onChange={(e) => update('validityDaysDefault', Number(e.target.value) || 0)}
          />
          <Input
            label="Default Payment Terms"
            value={form.paymentTermsDefault}
            onChange={(e) => update('paymentTermsDefault', e.target.value)}
          />
        </div>
        <div className="mt-4">
          <Textarea label="Quote Footer" value={form.footerText} onChange={(e) => update('footerText', e.target.value)} />
        </div>
      </Card>

      <Card className="p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-base-400">PDF Theme</p>
        <div className="grid grid-cols-2 gap-4">
          <ColorField label="Primary Color" value={form.pdfTheme.primaryColor} onChange={(v) => update('pdfTheme', { ...form.pdfTheme, primaryColor: v })} />
          <ColorField label="Accent Color" value={form.pdfTheme.accentColor} onChange={(v) => update('pdfTheme', { ...form.pdfTheme, accentColor: v })} />
        </div>
      </Card>

      <Button size="lg" loading={saving} onClick={() => void handleSave()}>
        {saved ? 'Saved ✓' : 'Save Company Settings'}
      </Button>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-base-200">{label}</span>
      <div className="flex items-center gap-3 rounded-2xl border border-base-600 bg-base-900/60 px-3 py-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="size-8 cursor-pointer rounded-lg border-none bg-transparent" />
        <span className="text-sm text-base-300">{value}</span>
      </div>
    </label>
  );
}
