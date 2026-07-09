import { useState } from 'react';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Toggle';
import { slugify } from '@/lib/utils';
import type { AnnualCharge, PriceType, Service, UpgradeOption } from '@/types';

export function ServiceForm({
  initial,
  divisionId,
  categoryId,
  businessTypeId,
  order,
  onCancel,
  onSave,
}: {
  initial?: Service;
  divisionId: string;
  categoryId: string;
  businessTypeId?: string;
  order: number;
  onCancel: () => void;
  onSave: (service: Service) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [startingPrice, setStartingPrice] = useState(initial?.startingPrice ?? 0);
  const [priceType, setPriceType] = useState<PriceType>(initial?.priceType ?? 'starting');
  const [deliveryTime, setDeliveryTime] = useState(initial?.deliveryTime ?? '');
  const [includesText, setIncludesText] = useState(initial?.includes.join(', ') ?? '');
  const [upgrades, setUpgrades] = useState<UpgradeOption[]>(initial?.optionalUpgrades ?? []);
  const [annualCharges, setAnnualCharges] = useState<AnnualCharge[]>(initial?.annualCharges ?? []);
  const [bundleEnabled, setBundleEnabled] = useState(initial?.bundlePricing?.enabled ?? false);
  const [bundleUnitLabel, setBundleUnitLabel] = useState(initial?.bundlePricing?.unitLabel ?? 'unit');
  const [bundleUnitPrice, setBundleUnitPrice] = useState(initial?.bundlePricing?.unitPrice ?? 0);
  const [bundleMinUnits, setBundleMinUnits] = useState(initial?.bundlePricing?.minUnits ?? 1);
  const [bundleMinLabel, setBundleMinLabel] = useState(initial?.bundlePricing?.minUnitsLabel ?? '');
  const [active, setActive] = useState(initial?.active ?? true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const service: Service = {
        id: initial?.id ?? `${categoryId}-${slugify(name)}-${Date.now().toString(36)}`,
        divisionId,
        categoryId,
        businessTypeId: businessTypeId ?? null,
        name: name.trim(),
        description: description.trim() || undefined,
        startingPrice,
        priceType,
        deliveryTime: deliveryTime.trim() || undefined,
        includes: includesText.split(',').map((s) => s.trim()).filter(Boolean),
        optionalUpgrades: upgrades.filter((u) => u.name.trim()),
        annualCharges: annualCharges.filter((c) => c.name.trim()),
        bundlePricing: bundleEnabled
          ? { enabled: true, unitLabel: bundleUnitLabel, unitPrice: bundleUnitPrice, minUnits: bundleMinUnits, minUnitsLabel: bundleMinLabel }
          : null,
        order: initial?.order ?? order,
        active,
      };
      await onSave(service);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-accent-500/30 bg-base-900/60 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input label="Service Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Original Song" />
        <div>
          <span className="mb-2 block text-sm font-medium text-base-200">Price Type</span>
          <select
            value={priceType}
            onChange={(e) => setPriceType(e.target.value as PriceType)}
            className="h-[3.25rem] w-full rounded-2xl border border-base-600 bg-base-900/60 px-4 text-sm text-base-100 outline-none focus:border-accent-500"
          >
            <option value="starting">Starting From</option>
            <option value="fixed">Fixed Price</option>
            <option value="bundle">Bundle</option>
          </select>
        </div>
        <Input
          label="Starting Price (₹)"
          type="number"
          value={startingPrice}
          onChange={(e) => setStartingPrice(Number(e.target.value) || 0)}
        />
        <Input label="Delivery Time" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} placeholder="e.g. 1-2 weeks" />
      </div>

      <div className="mt-3">
        <Input
          label="Includes (comma separated)"
          value={includesText}
          onChange={(e) => setIncludesText(e.target.value)}
          placeholder="Lyrics, Composition, Mixing"
        />
      </div>

      <div className="mt-3">
        <Textarea
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A short line shown when the service is expanded"
        />
      </div>

      <ListEditor
        title="Optional Upgrades"
        rows={upgrades}
        onChange={setUpgrades}
        addLabel="Add Upgrade"
        makeNew={() => ({ id: `${Date.now().toString(36)}-${upgrades.length}`, name: '', price: 0 })}
      />

      <ListEditor
        title="Annual Charges"
        rows={annualCharges}
        onChange={setAnnualCharges}
        addLabel="Add Annual Charge"
        withDefaultIncluded
        makeNew={() => ({ id: `${Date.now().toString(36)}-${annualCharges.length}`, name: '', price: 0, defaultIncluded: false })}
      />

      <div className="mt-4 rounded-xl border border-base-700 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-base-200">Bundle Pricing</span>
          <Switch checked={bundleEnabled} onChange={setBundleEnabled} />
        </div>
        {bundleEnabled && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Input label="Unit Label" value={bundleUnitLabel} onChange={(e) => setBundleUnitLabel(e.target.value)} placeholder="post" />
            <Input label="Unit Price (₹)" type="number" value={bundleUnitPrice} onChange={(e) => setBundleUnitPrice(Number(e.target.value) || 0)} />
            <Input label="Minimum Units" type="number" value={bundleMinUnits} onChange={(e) => setBundleMinUnits(Number(e.target.value) || 1)} />
            <Input label="Minimum Label" value={bundleMinLabel} onChange={(e) => setBundleMinLabel(e.target.value)} placeholder="4 posts/month" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-base-700 px-3 py-2.5">
        <span className="text-sm font-medium text-base-200">Active (visible to team)</span>
        <Switch checked={active} onChange={setActive} />
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button loading={saving} onClick={() => void handleSave()} className="flex-1">
          Save Service
        </Button>
      </div>
    </div>
  );
}

function ListEditor<T extends { id: string; name: string; price: number }>({
  title,
  rows,
  onChange,
  addLabel,
  withDefaultIncluded,
  makeNew,
}: {
  title: string;
  rows: T[];
  onChange: (rows: T[]) => void;
  addLabel: string;
  withDefaultIncluded?: boolean;
  makeNew: () => T;
}) {
  return (
    <div className="mt-4">
      <span className="mb-2 block text-sm font-medium text-base-200">{title}</span>
      <div className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <div key={row.id} className="flex items-center gap-2">
            <input
              value={row.name}
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...row, name: e.target.value };
                onChange(next);
              }}
              placeholder="Name"
              className="h-10 flex-1 rounded-xl border border-base-600 bg-base-900/60 px-3 text-sm text-base-100 outline-none focus:border-accent-500"
            />
            <input
              type="number"
              value={row.price}
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...row, price: Number(e.target.value) || 0 };
                onChange(next);
              }}
              placeholder="₹"
              className="h-10 w-24 rounded-xl border border-base-600 bg-base-900/60 px-3 text-sm text-base-100 outline-none focus:border-accent-500"
            />
            {withDefaultIncluded && (
              <Switch
                checked={(row as unknown as AnnualCharge).defaultIncluded ?? false}
                onChange={(v) => {
                  const next = [...rows];
                  next[i] = { ...row, defaultIncluded: v } as T;
                  onChange(next);
                }}
              />
            )}
            <button
              onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
              className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-base-700 text-base-400 hover:border-red-500/50 hover:text-red-400"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          onClick={() => onChange([...rows, makeNew()])}
          className="mt-1 rounded-xl border border-dashed border-base-600 py-2 text-sm text-base-400 hover:border-base-400 hover:text-base-200"
        >
          + {addLabel}
        </button>
      </div>
    </div>
  );
}
