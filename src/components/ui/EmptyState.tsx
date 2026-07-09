import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function EmptyState({
  icon = '✨',
  title,
  description,
  action,
  className,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-base-700 px-6 py-16 text-center animate-fade-in',
        className,
      )}
    >
      <span className="text-4xl">{icon}</span>
      <h3 className="text-lg font-semibold text-base-100">{title}</h3>
      {description && <p className="max-w-sm text-sm text-base-400">{description}</p>}
      {action}
    </div>
  );
}
