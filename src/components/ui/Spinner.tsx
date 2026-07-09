import { cn } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <span className="size-6 rounded-full border-2 border-base-600 border-t-accent-400 animate-spin" />
    </div>
  );
}

export function FullscreenLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-base-950">
      <div className="flex flex-col items-center gap-4">
        <span className="size-8 rounded-full border-2 border-base-700 border-t-accent-400 animate-spin" />
        <span className="text-sm text-base-400">Loading Kode31 Quote Studio…</span>
      </div>
    </div>
  );
}
