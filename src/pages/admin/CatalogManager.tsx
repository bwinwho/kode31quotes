import { useState } from 'react';
import { useDivisions, useCategories, useBusinessTypes, useServices } from '@/hooks/useCatalog';
import {
  saveCategory,
  deleteCategory,
  saveBusinessType,
  deleteBusinessType,
  saveService,
  deleteService,
} from '@/lib/firestoreService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Toggle';
import { Input } from '@/components/ui/Input';
import { formatINR, slugify } from '@/lib/utils';
import { ServiceForm } from './ServiceForm';
import type { BusinessType, Category, Service } from '@/types';

function reorder<T extends { order: number }>(items: T[], index: number, dir: -1 | 1): [T, T] | null {
  const target = index + dir;
  if (target < 0 || target >= items.length) return null;
  return [items[index]!, items[target]!];
}

export function CatalogManager() {
  const { divisions } = useDivisions();
  const [divisionId, setDivisionId] = useState('universe');
  const { categories } = useCategories(divisionId);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const activeCategory = categories.find((c) => c.id === categoryId) ?? null;

  const division = divisions.find((d) => d.id === divisionId);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2">
        {divisions.map((d) => (
          <button
            key={d.id}
            onClick={() => {
              setDivisionId(d.id);
              setCategoryId(null);
            }}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
              divisionId === d.id ? 'border-accent-500 bg-accent-500/15 text-accent-300' : 'border-base-700 text-base-300 hover:border-base-500'
            }`}
          >
            {d.icon} {d.name}
          </button>
        ))}
      </div>

      <CategoryManager divisionId={divisionId} categories={categories} activeCategoryId={categoryId} onSelect={setCategoryId} />

      {activeCategory && (
        activeCategory.hasBusinessTypes ? (
          <BusinessTypeSection category={activeCategory} />
        ) : (
          <ServiceSection divisionId={divisionId} categoryId={activeCategory.id} title={`${activeCategory.name} Services`} />
        )
      )}

      {!division && <p className="text-sm text-base-400">Select a division to manage its catalog.</p>}
    </div>
  );
}

function CategoryManager({
  divisionId,
  categories,
  activeCategoryId,
  onSelect,
}: {
  divisionId: string;
  categories: Category[];
  activeCategoryId: string | null;
  onSelect: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const category: Category = {
      id: `${divisionId}-${slugify(newName)}`,
      divisionId,
      name: newName.trim(),
      slug: slugify(newName),
      icon: '✨',
      order: categories.length + 1,
      active: true,
    };
    await saveCategory(category);
    setNewName('');
    setAdding(false);
  };

  const move = async (index: number, dir: -1 | 1) => {
    const pair = reorder(categories, index, dir);
    if (!pair) return;
    const [a, b] = pair;
    await Promise.all([saveCategory({ ...a, order: b.order }), saveCategory({ ...b, order: a.order })]);
  };

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-base-400">Categories</p>
        <button onClick={() => setAdding((v) => !v)} className="text-xs font-medium text-accent-300 hover:text-accent-200">
          {adding ? 'Cancel' : '+ Add Category'}
        </button>
      </div>

      {adding && (
        <div className="mb-3 flex gap-2">
          <div className="flex-1">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Category name" />
          </div>
          <Button onClick={() => void handleAdd()}>Add</Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {categories.map((c, i) => (
          <div
            key={c.id}
            className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm ${
              activeCategoryId === c.id ? 'border-accent-500 bg-accent-500/15 text-accent-300' : 'border-base-700 text-base-300'
            }`}
          >
            <button onClick={() => onSelect(c.id)} className="font-medium">
              {c.icon} {c.name}
            </button>
            <button onClick={() => void move(i, -1)} className="text-base-500 hover:text-base-200">
              ↑
            </button>
            <button onClick={() => void move(i, 1)} className="text-base-500 hover:text-base-200">
              ↓
            </button>
            <button
              onClick={() => void saveCategory({ ...c, active: !c.active })}
              className={c.active ? 'text-emerald-400' : 'text-base-500'}
              title="Toggle active"
            >
              ●
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete category "${c.name}"? Services under it will remain but be hidden.`)) void deleteCategory(c.id);
              }}
              className="text-base-500 hover:text-red-400"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BusinessTypeSection({ category }: { category: Category }) {
  const { businessTypes } = useBusinessTypes(category.id);
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const bt: BusinessType = {
      id: `${category.id}-${slugify(newName)}`,
      categoryId: category.id,
      name: newName.trim(),
      icon: '📱',
      order: businessTypes.length + 1,
      active: true,
    };
    await saveBusinessType(bt);
    setNewName('');
    setAdding(false);
  };

  const move = async (index: number, dir: -1 | 1) => {
    const pair = reorder(businessTypes, index, dir);
    if (!pair) return;
    const [a, b] = pair;
    await Promise.all([saveBusinessType({ ...a, order: b.order }), saveBusinessType({ ...b, order: a.order })]);
  };

  const active = businessTypes.find((b) => b.id === selected);

  return (
    <>
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-base-400">Business Types (Apps)</p>
          <button onClick={() => setAdding((v) => !v)} className="text-xs font-medium text-accent-300 hover:text-accent-200">
            {adding ? 'Cancel' : '+ Add Business Type'}
          </button>
        </div>
        {adding && (
          <div className="mb-3 flex gap-2">
            <div className="flex-1">
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Salon" />
            </div>
            <Button onClick={() => void handleAdd()}>Add</Button>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {businessTypes.map((bt, i) => (
            <div
              key={bt.id}
              className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm ${
                selected === bt.id ? 'border-accent-500 bg-accent-500/15 text-accent-300' : 'border-base-700 text-base-300'
              }`}
            >
              <button onClick={() => setSelected(bt.id)} className="font-medium">
                {bt.icon} {bt.name}
              </button>
              <button onClick={() => void move(i, -1)} className="text-base-500 hover:text-base-200">
                ↑
              </button>
              <button onClick={() => void move(i, 1)} className="text-base-500 hover:text-base-200">
                ↓
              </button>
              <button
                onClick={() => void saveBusinessType({ ...bt, active: !bt.active })}
                className={bt.active ? 'text-emerald-400' : 'text-base-500'}
              >
                ●
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete "${bt.name}"?`)) void deleteBusinessType(bt.id);
                }}
                className="text-base-500 hover:text-red-400"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </Card>

      {active && <ServiceSection divisionId="multiverse" categoryId={category.id} businessTypeId={active.id} title={`${active.name} Modules`} />}
    </>
  );
}

function ServiceSection({
  divisionId,
  categoryId,
  businessTypeId,
  title,
}: {
  divisionId: string;
  categoryId: string;
  businessTypeId?: string;
  title: string;
}) {
  const { services } = useServices();
  const filtered = services
    .filter((s) => s.categoryId === categoryId && (businessTypeId ? s.businessTypeId === businessTypeId : !s.businessTypeId))
    .sort((a, b) => a.order - b.order);

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const move = async (index: number, dir: -1 | 1) => {
    const pair = reorder(filtered, index, dir);
    if (!pair) return;
    const [a, b] = pair;
    await Promise.all([saveService({ ...a, order: b.order }), saveService({ ...b, order: a.order })]);
  };

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-base-400">{title}</p>
        <button onClick={() => setAdding((v) => !v)} className="text-xs font-medium text-accent-300 hover:text-accent-200">
          {adding ? 'Cancel' : '+ Add Service'}
        </button>
      </div>

      {adding && (
        <div className="mb-4">
          <ServiceForm
            divisionId={divisionId}
            categoryId={categoryId}
            businessTypeId={businessTypeId}
            order={filtered.length + 1}
            onCancel={() => setAdding(false)}
            onSave={async (service) => {
              await saveService(service);
              setAdding(false);
            }}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        {filtered.map((service, i) =>
          editingId === service.id ? (
            <ServiceForm
              key={service.id}
              initial={service}
              divisionId={divisionId}
              categoryId={categoryId}
              businessTypeId={businessTypeId}
              order={service.order}
              onCancel={() => setEditingId(null)}
              onSave={async (updated) => {
                await saveService(updated);
                setEditingId(null);
              }}
            />
          ) : (
            <ServiceRow key={service.id} service={service} onEdit={() => setEditingId(service.id)} onMove={(dir) => void move(i, dir)} />
          ),
        )}
        {filtered.length === 0 && !adding && <p className="text-sm text-base-500">No services yet.</p>}
      </div>
    </Card>
  );
}

function ServiceRow({ service, onEdit, onMove }: { service: Service; onEdit: () => void; onMove: (dir: -1 | 1) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-base-700 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-base-100">{service.name}</p>
        <p className="text-xs text-base-400">
          {service.priceType === 'fixed' ? formatINR(service.startingPrice) : `From ${formatINR(service.startingPrice)}`}
          {service.deliveryTime ? ` · ${service.deliveryTime}` : ''}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button onClick={() => onMove(-1)} className="flex size-8 items-center justify-center rounded-lg text-base-400 hover:bg-base-800">
          ↑
        </button>
        <button onClick={() => onMove(1)} className="flex size-8 items-center justify-center rounded-lg text-base-400 hover:bg-base-800">
          ↓
        </button>
        <Switch checked={service.active} onChange={(v) => void saveService({ ...service, active: v })} />
        <button onClick={onEdit} className="flex size-8 items-center justify-center rounded-lg text-base-400 hover:bg-base-800 hover:text-base-100">
          ✎
        </button>
        <button
          onClick={() => {
            if (confirm(`Delete "${service.name}"?`)) void deleteService(service.id);
          }}
          className="flex size-8 items-center justify-center rounded-lg text-base-400 hover:bg-red-500/10 hover:text-red-400"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
