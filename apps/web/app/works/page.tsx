import { ArtworkCard } from '@/components/shop/artwork-card';
import { fetchCatalog } from '@/lib/api';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Работы',
  description: 'Живопись маслом, брелоки и декор ручной работы. Каждая работа в одном экземпляре.',
};

export const revalidate = 60;

const FILTERS = [
  { key: undefined, label: 'Все' },
  { key: 'painting', label: 'Живопись' },
  { key: 'keychain', label: 'Брелоки' },
  { key: 'decor', label: 'Декор' },
] as const;

type Props = {
  searchParams: Promise<{ kind?: string; only?: string }>;
};

export default async function CatalogPage({ searchParams }: Props) {
  const { kind, only } = await searchParams;
  const onlyAvailable = only === 'available';

  const { items } = await fetchCatalog({ kind, includeSold: !onlyAvailable });

  const href = (next: { kind?: string; only?: string }) => {
    const q = new URLSearchParams();
    if (next.kind) q.set('kind', next.kind);
    if (next.only) q.set('only', next.only);
    const s = q.toString();
    return s ? `/works?${s}` : '/works';
  };

  return (
    <main className="mx-auto max-w-[var(--container)] px-5 py-12 md:px-10 md:py-20">
      <p className="eyebrow mb-3">каталог</p>
      <h1 className="text-[length:var(--text-3xl)]" style={{ fontFamily: 'var(--font-serif)' }}>
        Работы
      </h1>
      <p className="mt-4 max-w-[var(--container-read)] text-muted-foreground">
        Каждая работа существует в единственном экземпляре. Проданные остаются в каталоге — по ним
        можно заказать похожую.
      </p>

      <div className="mt-10 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const active = kind === f.key || (!kind && !f.key);
          return (
            <Link
              key={f.label}
              href={href({ kind: f.key, only: only })}
              className="min-h-9 rounded-[var(--radius-full)] border px-4 py-1.5 text-[length:var(--text-sm)] transition-colors"
              style={{
                borderColor: active ? 'var(--primary)' : 'var(--border)',
                background: active ? 'var(--primary-tint)' : 'transparent',
                color: active ? 'var(--primary)' : 'var(--fg-muted)',
              }}
            >
              {f.label}
            </Link>
          );
        })}

        <Link
          href={href({ kind, only: onlyAvailable ? undefined : 'available' })}
          className="ml-auto min-h-9 rounded-[var(--radius-full)] border px-4 py-1.5 text-[length:var(--text-sm)] transition-colors"
          style={{
            borderColor: onlyAvailable ? 'var(--primary)' : 'var(--border)',
            background: onlyAvailable ? 'var(--primary-tint)' : 'transparent',
            color: onlyAvailable ? 'var(--primary)' : 'var(--fg-muted)',
          }}
        >
          Только в наличии
        </Link>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((work, i) => (
          // первые три карточки попадают в первый экран - грузим без задержки
          <ArtworkCard key={work.slug} work={work} priority={i < 3} />
        ))}
      </div>

      {items.length === 0 && (
        <p className="mt-12 text-muted-foreground">
          В этой категории пока нет работ. Загляните позже или напишите — возможно, есть в
          мастерской.
        </p>
      )}
    </main>
  );
}
