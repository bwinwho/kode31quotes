import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuoteStore } from '@/store/quoteStore';
import { useCategories, useServices } from '@/hooks/useCatalog';
import { PageHeader } from '@/components/layout/PageHeader';
import { ServiceCard } from '@/components/quote/ServiceCard';
import { QuoteFloatingBar } from '@/components/quote/QuoteFloatingBar';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';

export default function CategoryServices() {
  const navigate = useNavigate();
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const division = useQuoteStore((s) => s.division);
  const customer = useQuoteStore((s) => s.customer);
  const setCategoryPath = useQuoteStore((s) => s.setCategoryPath);
  const { categories, loading: loadingCategories } = useCategories('multiverse');
  const { services, loading: loadingServices } = useServices();

  const category = categories.find((c) => c.slug === categorySlug);

  useEffect(() => {
    if (category) setCategoryPath([category.name]);
  }, [category, setCategoryPath]);

  if (!division || !customer) {
    navigate('/', { replace: true });
    return null;
  }

  const loading = loadingCategories || loadingServices;
  const items = category ? services.filter((s) => s.categoryId === category.id && !s.businessTypeId && s.active) : [];

  return (
    <div className="animate-fade-up pb-24">
      <PageHeader title={category?.name ?? 'Services'} subtitle={category?.prompt} onBack />

      {loading ? (
        <Spinner className="py-16" />
      ) : items.length === 0 ? (
        <EmptyState icon="✨" title="No services yet" description="Ask an admin to add services for this category." />
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {items.map((service) => (
            <ServiceCard key={service.id} service={service} categoryName={category!.name} />
          ))}
        </div>
      )}

      <QuoteFloatingBar />
    </div>
  );
}
