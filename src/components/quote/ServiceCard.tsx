import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { formatINR, cn } from '@/lib/utils';
import { useQuoteStore } from '@/store/quoteStore';
import type { Service } from '@/types';

export function ServiceCard({
  service,
  categoryName,
  businessTypeName,
}: {
  service: Service;
  categoryName: string;
  businessTypeName?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const added = useQuoteStore((s) => s.hasItem(service.id));
  const item = useQuoteStore((s) => s.items.find((i) => i.serviceId === service.id));
  const addService = useQuoteStore((s) => s.addService);
  const removeItem = useQuoteStore((s) => s.removeItem);
  const toggleUpgrade = useQuoteStore((s) => s.toggleUpgrade);
  const toggleAnnualCharge = useQuoteStore((s) => s.toggleAnnualCharge);
  const setQuantity = useQuoteStore((s) => s.setQuantity);

  const priceLabel =
    service.priceType === 'fixed'
      ? formatINR(service.startingPrice)
      : `Starting From ${formatINR(service.startingPrice)}`;

  const handleAddToggle = () => {
    if (added) {
      removeItem(service.id);
      setExpanded(false);
    } else {
      addService(service, categoryName, businessTypeName);
      setExpanded(true);
    }
  };

  return (
    <Card className={cn('overflow-hidden transition-colors duration-300', added && 'border-accent-500/50')}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((e) => !e)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
        className="flex w-full cursor-pointer items-start justify-between gap-4 p-5 text-left"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-base-50">{service.name}</h3>
            {service.bundlePricing?.enabled && (
              <span className="rounded-full bg-gold-500/15 px-2 py-0.5 text-[11px] font-medium text-gold-400">
                Bundle available
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-medium text-accent-300">{priceLabel}</p>
          {service.deliveryTime && (
            <p className="mt-1.5 text-xs text-base-400">Delivery: {service.deliveryTime}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            variant={added ? 'secondary' : 'primary'}
            onClick={(e) => {
              e.stopPropagation();
              handleAddToggle();
            }}
          >
            {added ? 'Added ✓' : 'Add'}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="animate-fade-in border-t border-base-700/60 p-5 pt-4">
          {service.description && <p className="mb-4 text-sm text-base-300">{service.description}</p>}

          {service.includes.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-400">Includes</p>
              <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {service.includes.map((inc) => (
                  <li key={inc} className="flex items-center gap-2 text-sm text-base-200">
                    <svg viewBox="0 0 12 12" className="size-3.5 shrink-0 fill-none stroke-accent-400 stroke-[2]">
                      <path d="M2 6l2.5 2.5L10 3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {inc}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {added && item && service.bundlePricing?.enabled && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-400">
                Quantity ({service.bundlePricing.unitLabel}s)
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(service.id, item.quantity - 1)}
                  className="flex size-9 items-center justify-center rounded-xl border border-base-600 text-base-200 hover:border-base-400"
                >
                  −
                </button>
                <span className="w-10 text-center text-base font-semibold text-base-50">{item.quantity}</span>
                <button
                  onClick={() => setQuantity(service.id, item.quantity + 1)}
                  className="flex size-9 items-center justify-center rounded-xl border border-base-600 text-base-200 hover:border-base-400"
                >
                  +
                </button>
                {item.quantity >= service.bundlePricing.minUnits ? (
                  <span className="text-xs font-medium text-emerald-400">
                    Bundle rate applied — {formatINR(service.bundlePricing.unitPrice)}/{service.bundlePricing.unitLabel}
                  </span>
                ) : (
                  <span className="text-xs text-base-400">
                    {service.bundlePricing.minUnitsLabel} for bundle rate
                  </span>
                )}
              </div>
            </div>
          )}

          {service.optionalUpgrades.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-400">Optional Upgrades</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {service.optionalUpgrades.map((upg) => (
                  <Toggle
                    key={upg.id}
                    label={upg.name}
                    price={`+${formatINR(upg.price)}`}
                    checked={!!item?.selectedUpgrades.some((u) => u.id === upg.id)}
                    disabled={!added}
                    onChange={() => {
                      if (!added) addService(service, categoryName, businessTypeName);
                      toggleUpgrade(service.id, upg);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {service.annualCharges.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-400">Annual Care (optional)</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {service.annualCharges.map((chg) => (
                  <Toggle
                    key={chg.id}
                    label={chg.name}
                    price={`${formatINR(chg.price)}/yr`}
                    checked={!!item?.annualCharges.find((c) => c.id === chg.id)?.included}
                    disabled={!added}
                    onChange={() => toggleAnnualCharge(service.id, chg.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {!added && (
            <Button className="mt-4 w-full" onClick={() => handleAddToggle()}>
              Add to Quote
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
