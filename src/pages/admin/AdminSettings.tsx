import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CompanySettingsForm } from './CompanySettingsForm';
import { CatalogManager } from './CatalogManager';
import { TeamManager } from './TeamManager';
import { cn } from '@/lib/utils';

type Tab = 'catalog' | 'company' | 'team';

export default function AdminSettings() {
  const [tab, setTab] = useState<Tab>('catalog');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'catalog', label: 'Catalog & Pricing' },
    { id: 'company', label: 'Company' },
    { id: 'team', label: 'Team' },
  ];

  return (
    <div className="animate-fade-up pb-24">
      <PageHeader title="Admin Settings" subtitle="Everything here is editable without touching code" />

      <div className="mt-5 flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'shrink-0 rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
              tab === t.id ? 'border-accent-500 bg-accent-500/15 text-accent-300' : 'border-base-700 text-base-300 hover:border-base-500',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'catalog' && <CatalogManager />}
        {tab === 'company' && <CompanySettingsForm />}
        {tab === 'team' && <TeamManager />}
      </div>
    </div>
  );
}
