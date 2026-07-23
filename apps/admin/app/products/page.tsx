'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { adminApi } from '@/lib/admin-api';
import type { AdminProductListItem } from '@artshop/shared';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

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

export default function AdminProductsPage() {
  const [items, setItems] = useState<AdminProductListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .listProducts()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl">Работы</h1>
        <Button asChild>
          <Link href="/products/new">
            <Plus className="size-4" />
            Добавить работу
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="mt-6 flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="mt-8 text-muted-foreground">Работ пока нет. Добавьте первую.</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border bg-card">
          <div className="flex flex-col divide-y">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/products/${item.id}`}
                className="flex items-center gap-4 p-3 transition-colors hover:bg-accent/50"
              >
                <div className="size-14 shrink-0 overflow-hidden rounded-sm bg-muted">
                  {item.coverThumbUrl && (
                    <img src={item.coverThumbUrl} alt="" className="size-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.imagesCount} фото · /{item.slug}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0 gap-1.5">
                  <span
                    className="size-1.5 rounded-full"
                    style={{ background: STATUS_DOT[item.status] }}
                  />
                  {STATUS_LABEL[item.status]}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
