import { useNavigate } from 'react-router-dom';
import { useQuoteStore } from '@/store/quoteStore';
import { useCategories } from '@/hooks/useCatalog';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { QuoteFloatingBar } from '@/components/quote/QuoteFloatingBar';

export default function MultiverseHome() {
  const navigate = useNavigate();
  const division = useQuoteStore((s) => s.division);
  const customer = useQuoteStore((s) => s.customer);
  const { categories, loading } = useCategories('multiverse');

  if (!division || !customer) {
    navigate('/', { replace: true });
    return null;
  }

  return (
    <div className="animate-fade-up pb-24">
      <PageHeader title="What do you need today?" subtitle={`Quote for ${customer.name}`} onBack />

      {loading ? (
        <Spinner className="py-16" />
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {categories
            .filter((c) => c.active)
            .map((category, i) => (
              <Card
                key={category.id}
                interactive
                onClick={() => navigate(`/multiverse/${category.slug}`)}
                className="flex animate-fade-up flex-col items-center gap-3 p-6 text-center"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className="text-3xl">{category.icon}</span>
                <span className="text-sm font-semibold text-base-100">{category.name}</span>
              </Card>
            ))}
        </div>
      )}

      <QuoteFloatingBar />
    </div>
  );
}
