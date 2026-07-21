'use client';

import { adminApi } from '@/lib/admin-api';
import type { AdminProductListItem } from '@artshop/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const STATUS_LABEL: Record<string, string> = {
  draft: 'Черновик',
  available: 'В наличии',
  reserved: 'Забронирована',
  sold: 'Продана',
  archived: 'В архиве',
};

const STATUS_COLOR: Record<string, string> = {
  draft: 'var(--fg-faint)',
  available: 'var(--status-available)',
  reserved: 'var(--status-order)',
  sold: 'var(--status-sold)',
  archived: 'var(--fg-faint)',
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
        <h1 className="text-[length:var(--text-2xl)]">Работы</h1>
        <Link
          href="/admin/products/new"
          className="min-h-[var(--tap-min)] rounded-[var(--radius-md)] px-5 py-2.5 text-[length:var(--text-sm)]"
          style={{ background: 'var(--primary)', color: 'var(--primary-fg)' }}
        >
          + Добавить работу
        </Link>
      </div>

      {loading ? (
        <p className="mt-8 text-muted-foreground">Загрузка…</p>
      ) : items.length === 0 ? (
        <p className="mt-8 text-muted-foreground">Работ пока нет. Добавьте первую.</p>
      ) : (
        <div className="mt-6 flex flex-col divide-y divide-border rounded-[var(--radius-lg)] border border-border">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/admin/products/${item.id}`}
              className="flex items-center gap-4 p-3 transition-colors hover:bg-[var(--bg-subtle)]"
            >
              <div className="size-14 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--bg-subtle)]">
                {item.coverThumbUrl && (
                  <img src={item.coverThumbUrl} alt="" className="size-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate">{item.title}</p>
                <p className="text-[length:var(--text-xs)] text-muted-foreground">
                  {item.imagesCount} фото · /{item.slug}
                </p>
              </div>
              <span
                className="shrink-0 text-[length:var(--text-xs)] uppercase"
                style={{ letterSpacing: 'var(--tracking-caps)', color: STATUS_COLOR[item.status] }}
              >
                {STATUS_LABEL[item.status]}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
