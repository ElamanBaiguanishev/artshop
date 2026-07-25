'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { adminApi } from '@/lib/admin-api';
import type { AdminCategory, AdminProductListItem } from '@artshop/shared';
import { ImageOff, LayoutGrid, List, Plus, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const STATUS_LABEL: Record<string, string> = {
  draft: 'Черновик',
  available: 'В наличии',
  reserved: 'Забронирована',
  sold: 'Продана',
  archived: 'В архиве',
};

/** Цвет точки статуса берём из токенов темы (работает и в тёмной). */
const STATUS_DOT: Record<string, string> = {
  draft: 'var(--muted-foreground)',
  available: 'var(--status-available)',
  reserved: 'var(--status-order)',
  sold: 'var(--status-sold)',
  archived: 'var(--muted-foreground)',
};

type View = 'grid' | 'list';
const GRID = 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6';
const SKELETON_KEYS = Array.from({ length: 12 }, (_, i) => `sk-${i}`);

function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant="secondary" className={`gap-1.5 ${className ?? ''}`}>
      <span className="size-1.5 rounded-full" style={{ background: STATUS_DOT[status] }} />
      {STATUS_LABEL[status]}
    </Badge>
  );
}

export default function AdminProductsPage() {
  const [items, setItems] = useState<AdminProductListItem[]>([]);
  const [cats, setCats] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('grid');

  // фильтры
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    Promise.all([adminApi.listProducts(), adminApi.listCategories()])
      .then(([products, categories]) => {
        setItems(products);
        setCats(categories);
      })
      .finally(() => setLoading(false));
  }, []);

  // восстанавливаем вид и фильтры между заходами
  useEffect(() => {
    const savedView = localStorage.getItem('products-view');
    if (savedView === 'grid' || savedView === 'list') setView(savedView);

    const savedFilters = localStorage.getItem('products-filters');
    if (savedFilters) {
      try {
        const f = JSON.parse(savedFilters);
        if (typeof f.query === 'string') setQuery(f.query);
        if (typeof f.status === 'string') setStatus(f.status);
        if (typeof f.category === 'string') setCategory(f.category);
      } catch {
        // битый JSON — игнорируем
      }
    }
  }, []);

  function changeView(next: View) {
    setView(next);
    localStorage.setItem('products-view', next);
  }

  function persistFilters(patch: Partial<{ query: string; status: string; category: string }>) {
    localStorage.setItem('products-filters', JSON.stringify({ query, status, category, ...patch }));
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (status !== 'all' && it.status !== status) return false;
      if (category !== 'all' && it.category.slug !== category) return false;
      if (q && !it.title.toLowerCase().includes(q) && !it.slug.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [items, query, status, category]);

  const hasFilters = query.trim() !== '' || status !== 'all' || category !== 'all';

  function resetFilters() {
    setQuery('');
    setStatus('all');
    setCategory('all');
    localStorage.setItem(
      'products-filters',
      JSON.stringify({ query: '', status: 'all', category: 'all' }),
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h1 className="font-serif text-2xl">Работы</h1>
          {!loading && (
            <span className="text-sm text-muted-foreground">
              {hasFilters ? `${filtered.length} из ${items.length}` : items.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => v && changeView(v as View)}
            variant="outline"
          >
            <ToggleGroupItem value="list" aria-label="Списком">
              <List className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="grid" aria-label="Плиткой">
              <LayoutGrid className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          <Button asChild>
            <Link href="/products/new">
              <Plus className="size-4" />
              Добавить работу
            </Link>
          </Button>
        </div>
      </div>

      {/* панель фильтров */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              persistFilters({ query: e.target.value });
            }}
            placeholder="Поиск по названию или адресу"
            className="pl-9"
          />
        </div>

        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            persistFilters({ status: v });
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {Object.entries(STATUS_LABEL).map(([v, label]) => (
              <SelectItem key={v} value={v}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={category}
          onValueChange={(v) => {
            setCategory(v);
            persistFilters({ category: v });
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все типы</SelectItem>
            {cats.map((c) => (
              <SelectItem key={c.id} value={c.slug}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={resetFilters}
          >
            <X className="size-4" />
            Сбросить
          </Button>
        )}
      </div>

      {loading ? (
        <div className={`mt-6 ${view === 'grid' ? GRID : 'flex flex-col gap-2'}`}>
          {SKELETON_KEYS.slice(0, view === 'grid' ? 12 : 6).map((k) => (
            <Skeleton
              key={k}
              className={
                view === 'grid' ? 'aspect-[4/5] w-full rounded-xl' : 'h-20 w-full rounded-lg'
              }
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="mt-8 text-muted-foreground">Работ пока нет. Добавьте первую.</p>
      ) : filtered.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 text-center text-muted-foreground">
          <p>Ничего не найдено под эти фильтры.</p>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            Сбросить фильтры
          </Button>
        </div>
      ) : view === 'grid' ? (
        <div className={`mt-6 ${GRID}`}>
          {filtered.map((item) => (
            <Link key={item.id} href={`/products/${item.id}`} className="group">
              <Card className="gap-0 overflow-hidden py-0 transition-colors group-hover:border-primary">
                <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-muted">
                  {item.coverThumbUrl ? (
                    <img
                      src={item.coverThumbUrl}
                      alt=""
                      className="absolute inset-0 size-full object-cover"
                    />
                  ) : (
                    <ImageOff className="size-6 text-muted-foreground/50" />
                  )}
                  <StatusBadge
                    status={item.status}
                    className="absolute left-2 top-2 backdrop-blur-sm"
                  />
                </div>
                <div className="p-3">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.category.name} · {item.imagesCount} фото
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border bg-card">
          <div className="flex flex-col divide-y">
            {filtered.map((item) => (
              <Link
                key={item.id}
                href={`/products/${item.id}`}
                className="flex items-center gap-4 p-3 transition-colors hover:bg-accent/50"
              >
                <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-muted">
                  {item.coverThumbUrl ? (
                    <img src={item.coverThumbUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <ImageOff className="size-5 text-muted-foreground/50" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.category.name} · {item.imagesCount} фото · /{item.slug}
                  </p>
                </div>
                <StatusBadge status={item.status} className="shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
