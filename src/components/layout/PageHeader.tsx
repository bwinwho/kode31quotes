import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  onBack,
  action,
}: {
  title: string;
  subtitle?: string;
  onBack?: boolean | (() => void);
  action?: ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 -mx-5 mb-6 px-5 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] glass border-b border-base-800/60 sm:static sm:mx-0 sm:border-none sm:bg-transparent sm:px-0 sm:pt-0 sm:backdrop-blur-none">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={() => (typeof onBack === 'function' ? onBack() : navigate(-1))}
            aria-label="Back"
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-base-700 bg-base-850 text-base-200 transition-colors hover:border-base-500 hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold text-base-50 sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-0.5 truncate text-sm text-base-400">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}
