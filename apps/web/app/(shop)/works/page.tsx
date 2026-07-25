import { ArtworkCard } from '@/components/shop/artwork-card';
import { fetchCatalog, fetchCategories } from '@/lib/api';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Работы',
  description: 'Живопись маслом, брелоки и декор ручной работы. Каждая работа в одном экземпляре.',
};

export const revalidate = 60;

type Props = {
  searchParams: Promise<{ category?: string; only?: string }>;
};

export default async function CatalogPage({ searchParams }: Props) {
  const { category, only } = await searchParams;
  const onlyAvailable = only === 'available';

  const [{ items }, categories] = await Promise.all([
    fetchCatalog({ category, includeSold: !onlyAvailable }),
    fetchCategories(),
  ]);

  // фильтры собираются из типов (управляемый справочник), плюс «Все»
  const filters: { key?: string; label: string }[] = [
    { key: undefined, label: 'Все' },
    ...categories.map((c) => ({ key: c.slug, label: c.name })),
  ];

  const href = (next: { category?: string; only?: string }) => {
    const q = new URLSearchParams();
    if (next.category) q.set('category', next.category);
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
        {filters.map((f) => {
          const active = category === f.key || (!category && !f.key);
          return (
            <Link
              key={f.label}
              href={href({ category: f.key, only: only })}
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
          href={href({ category, only: onlyAvailable ? undefined : 'available' })}
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
