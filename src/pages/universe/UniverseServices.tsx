import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useQuoteStore } from '@/store/quoteStore';
import { useServices } from '@/hooks/useCatalog';
import { PageHeader } from '@/components/layout/PageHeader';
import { ServiceCard } from '@/components/quote/ServiceCard';
import { QuoteFloatingBar } from '@/components/quote/QuoteFloatingBar';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';

export default function UniverseServices() {
  const navigate = useNavigate();
  const division = useQuoteStore((s) => s.division);
  const customer = useQuoteStore((s) => s.customer);
  const setCategoryPath = useQuoteStore((s) => s.setCategoryPath);
  const { services, loading } = useServices();

  useEffect(() => {
    setCategoryPath(['Universe']);
  }, [setCategoryPath]);

  if (!division || !customer) {
    navigate('/', { replace: true });
    return null;
  }

  const universeServices = services.filter((s) => s.divisionId === 'universe' && s.active);

  return (
    <div className="animate-fade-up pb-24">
      <PageHeader title="Music & Creative" subtitle={`Quote for ${customer.name}`} onBack />

      {loading ? (
        <Spinner className="py-16" />
      ) : universeServices.length === 0 ? (
        <EmptyState icon="🎼" title="No services yet" description="Ask an admin to add Universe services in Settings." />
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {universeServices.map((service) => (
            <ServiceCard key={service.id} service={service} categoryName="Universe" />
          ))}
        </div>
      )}

      <QuoteFloatingBar />
    </div>
  );
}
