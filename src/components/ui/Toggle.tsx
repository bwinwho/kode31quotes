import { cn } from '@/lib/utils';

export function Toggle({
  checked,
  onChange,
  label,
  price,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  price?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all duration-200',
        checked
          ? 'border-accent-500/50 bg-accent-500/10'
          : 'border-base-700 bg-base-900/40 hover:border-base-500',
        disabled && 'opacity-50',
      )}
    >
      <span className="flex items-center gap-3">
        <span
          className={cn(
            'flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors',
            checked ? 'border-accent-500 bg-accent-500' : 'border-base-500',
          )}
        >
          {checked && (
            <svg viewBox="0 0 12 12" className="size-3 fill-none stroke-white stroke-[2.5]">
              <path d="M2 6l2.5 2.5L10 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        <span className="text-sm font-medium text-base-100">{label}</span>
      </span>
      {price && <span className="shrink-0 text-sm font-semibold text-base-200">{price}</span>}
    </button>
  );
}

export function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200',
        checked ? 'bg-accent-500' : 'bg-base-600',
      )}
    >
      <span
        className={cn(
          'absolute top-1 size-5 rounded-full bg-white shadow-md transition-transform duration-200',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  );
}
