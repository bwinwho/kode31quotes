import { useNavigate } from 'react-router-dom';
import { useQuoteStore } from '@/store/quoteStore';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export function QuoteFloatingBar() {
  const navigate = useNavigate();
  const items = useQuoteStore((s) => s.items);
  const grandTotal = useQuoteStore((s) => s.grandTotal());

  if (items.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.25rem)] z-40 px-4 sm:bottom-8 sm:left-[17rem] sm:right-8 sm:px-0">
      <div className="mx-auto flex max-w-md items-center justify-between gap-4 rounded-3xl border border-accent-500/30 glass px-5 py-4 shadow-glow sm:max-w-none">
        <div>
          <p className="text-xs text-base-400">
            {items.length} service{items.length > 1 ? 's' : ''} selected
          </p>
          <p className="font-display text-lg font-semibold text-base-50">{formatINR(grandTotal)}</p>
        </div>
        <Button onClick={() => navigate('/quote')}>Review Quote →</Button>
      </div>
    </div>
  );
}
