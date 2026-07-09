import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuoteStore } from '@/store/quoteStore';
import { useBusinessTypes, useServices } from '@/hooks/useCatalog';
import { PageHeader } from '@/components/layout/PageHeader';
import { ServiceCard } from '@/components/quote/ServiceCard';
import { QuoteFloatingBar } from '@/components/quote/QuoteFloatingBar';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AppsModules() {
  const navigate = useNavigate();
  const { businessTypeId } = useParams<{ businessTypeId: string }>();
  const division = useQuoteStore((s) => s.division);
  const customer = useQuoteStore((s) => s.customer);
  const setCategoryPath = useQuoteStore((s) => s.setCategoryPath);
  const { businessTypes, loading: loadingTypes } = useBusinessTypes('apps');
  const { services, loading: loadingServices } = useServices();

  const businessType = businessTypes.find((b) => b.id === businessTypeId);

  useEffect(() => {
    if (businessType) setCategoryPath(['Apps', businessType.name]);
  }, [businessType, setCategoryPath]);

  if (!division || !customer) {
    navigate('/', { replace: true });
    return null;
  }

  const modules = services.filter((s) => s.businessTypeId === businessTypeId && s.active);
  const loading = loadingTypes || loadingServices;

  return (
    <div className="animate-fade-up pb-24">
      <PageHeader
        title={businessType ? `${businessType.name} Modules` : 'Modules'}
        subtitle="Select one or many — clients only pay for what they need"
        onBack
      />

      {loading ? (
        <Spinner className="py-16" />
      ) : modules.length === 0 ? (
        <EmptyState icon="🧩" title="No modules yet" description="Ask an admin to add modules for this business type." />
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {modules.map((service) => (
            <ServiceCard key={service.id} service={service} categoryName="Apps" businessTypeName={businessType?.name} />
          ))}
        </div>
      )}

      <QuoteFloatingBar />
    </div>
  );
}
