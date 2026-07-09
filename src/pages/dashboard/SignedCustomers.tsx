import { useNavigate } from 'react-router-dom';
import { useQuotes } from '@/hooks/useQuotes';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatINR } from '@/lib/utils';

export default function SignedCustomers() {
  const navigate = useNavigate();
  const { quotes, loading } = useQuotes();

  const signed = quotes.filter((q) => q.status === 'Signed' || q.status === 'Accepted');

  return (
    <div className="animate-fade-up pb-24">
      <PageHeader title="Signed Customers" subtitle={`${signed.length} client${signed.length === 1 ? '' : 's'}`} />

      {loading ? (
        <Spinner className="py-16" />
      ) : signed.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon="🤝"
          title="No signed clients yet"
          description="Quotes marked Signed or Accepted will appear here as a lightweight client list."
        />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {signed.map((q) => (
            <Card key={q.id} interactive className="p-5" onClick={() => navigate(`/dashboard/${q.id}`)}>
              <p className="font-semibold text-base-50">{q.customer.name}</p>
              <p className="text-xs text-base-400">{q.customer.phone}</p>
              {q.customer.company && <p className="text-xs text-base-400">{q.customer.company}</p>}
              <p className="mt-4 font-display text-xl font-semibold text-base-100">{formatINR(q.total)}</p>
              <p className="mt-2 text-xs text-base-400">
                {q.items.map((i) => i.name).join(', ')}
              </p>
              <p className="mt-3 text-xs text-base-500">Purchased {formatDate(q.updatedAt)}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
