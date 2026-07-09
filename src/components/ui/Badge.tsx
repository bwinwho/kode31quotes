import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { QuoteStatus } from '@/types';

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-base-600 bg-base-800 px-2.5 py-1 text-xs font-medium text-base-200',
        className,
      )}
    >
      {children}
    </span>
  );
}

const statusStyles: Record<QuoteStatus, string> = {
  Draft: 'bg-base-700 text-base-200 border-base-600',
  Sent: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  Signed: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  Accepted: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  Rejected: 'bg-red-500/10 text-red-300 border-red-500/30',
};

export function StatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold', statusStyles[status])}>
      {status}
    </span>
  );
}
