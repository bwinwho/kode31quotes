import { useNavigate } from 'react-router-dom';
import { useQuoteStore } from '@/store/quoteStore';
import { useBusinessTypes, useCategories } from '@/hooks/useCatalog';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { QuoteFloatingBar } from '@/components/quote/QuoteFloatingBar';

export default function AppsBusinessPicker() {
  const navigate = useNavigate();
  const division = useQuoteStore((s) => s.division);
  const customer = useQuoteStore((s) => s.customer);
  const { categories } = useCategories('multiverse');
  const { businessTypes, loading } = useBusinessTypes('apps');

  if (!division || !customer) {
    navigate('/', { replace: true });
    return null;
  }

  const category = categories.find((c) => c.id === 'apps');

  return (
    <div className="animate-fade-up pb-24">
      <PageHeader title="What are we building?" subtitle={category?.prompt ?? 'Pick the closest match'} onBack />

      {loading ? (
        <Spinner className="py-16" />
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {businessTypes
            .filter((b) => b.active)
            .map((bt, i) => (
              <Card
                key={bt.id}
                interactive
                onClick={() => navigate(`/multiverse/apps/${bt.id}`)}
                className="flex animate-fade-up flex-col items-center gap-3 p-6 text-center"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="text-3xl">{bt.icon}</span>
                <span className="text-sm font-semibold text-base-100">{bt.name}</span>
              </Card>
            ))}
        </div>
      )}

      <QuoteFloatingBar />
    </div>
  );
}
