import { ArtworkCard } from '@/components/shop/artwork-card';
import { fetchCatalog } from '@/lib/api';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Работы',
  description: 'Живопись маслом, брелоки и декор ручной работы. Каждая работа в одном экземпляре.',
};

// ISR: страница статична, пересобирается по таймеру и по событию из админки
export const revalidate = 60;

export default async function CatalogPage() {
  const { items } = await fetchCatalog();

  return (
    <main className="mx-auto max-w-[var(--container)] px-5 py-16 md:px-10 md:py-24">
      <p className="eyebrow mb-3">каталог</p>
      <h1 className="text-[length:var(--text-3xl)]">Работы</h1>
      <p className="mt-4 max-w-[var(--container-read)] text-muted-foreground">
        Каждая работа существует в единственном экземпляре. Проданные остаются в каталоге — по ним
        можно заказать похожую.
      </p>

      <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((work, i) => (
          // первые три карточки попадают в первый экран - грузим без задержки
          <ArtworkCard key={work.slug} work={work} priority={i < 3} />
        ))}
      </div>

      {items.length === 0 && (
        <p className="mt-12 text-muted-foreground">Пока ни одной опубликованной работы.</p>
      )}
    </main>
  );
}
