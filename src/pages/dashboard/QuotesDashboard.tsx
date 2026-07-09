import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuotes } from '@/hooks/useQuotes';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatINR } from '@/lib/utils';
import type { QuoteStatus } from '@/types';

const STATUSES: QuoteStatus[] = ['Draft', 'Sent', 'Signed', 'Accepted', 'Rejected'];

export default function QuotesDashboard() {
  const navigate = useNavigate();
  const { quotes, loading } = useQuotes();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<QuoteStatus | 'All'>('All');
  const [member, setMember] = useState<string>('All');

  const members = useMemo(() => {
    const names = new Set(quotes.map((q) => q.createdBy.name));
    return ['All', ...Array.from(names)];
  }, [quotes]);

  const filtered = quotes.filter((q) => {
    const matchesSearch =
      !search ||
      q.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      q.quoteNumber.toLowerCase().includes(search.toLowerCase()) ||
      (q.customer.company ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === 'All' || q.status === status;
    const matchesMember = member === 'All' || q.createdBy.name === member;
    return matchesSearch && matchesStatus && matchesMember;
  });

  return (
    <div className="animate-fade-up pb-24">
      <PageHeader title="Quotes" subtitle={`${quotes.length} total`} />

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer, company, or quote #"
          className="h-11 w-full rounded-xl border border-base-600 bg-base-900/60 px-4 text-sm text-base-100 outline-none focus:border-accent-500 sm:max-w-sm"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as QuoteStatus | 'All')}
          className="h-11 rounded-xl border border-base-600 bg-base-900/60 px-3 text-sm text-base-100 outline-none focus:border-accent-500"
        >
          <option value="All">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={member}
          onChange={(e) => setMember(e.target.value)}
          className="h-11 rounded-xl border border-base-600 bg-base-900/60 px-3 text-sm text-base-100 outline-none focus:border-accent-500"
        >
          {members.map((m) => (
            <option key={m} value={m}>
              {m === 'All' ? 'All Team Members' : m}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <Spinner className="py-16" />
      ) : filtered.length === 0 ? (
        <EmptyState className="mt-6" icon="📋" title="No quotes found" description="Try a different search or filter." />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((q) => (
            <Card key={q.id} interactive className="p-5" onClick={() => navigate(`/dashboard/${q.id}`)}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-base-50">{q.customer.name}</p>
                  {q.customer.company && <p className="truncate text-xs text-base-400">{q.customer.company}</p>}
                </div>
                <StatusBadge status={q.status} />
              </div>
              <p className="mt-4 font-display text-xl font-semibold text-base-100">{formatINR(q.total)}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-base-400">
                <span>{q.quoteNumber}</span>
                <span>{formatDate(q.createdAt)}</span>
              </div>
              <p className="mt-1 text-xs text-base-500">by {q.createdBy.name}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
