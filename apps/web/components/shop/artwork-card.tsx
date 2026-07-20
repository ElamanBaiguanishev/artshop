import type { PublicProductCard } from '@artshop/shared';
import Link from 'next/link';
import { BlurImage } from './blur-image';

function formatPrice(price: PublicProductCard['price']): string | null {
  if (!price) return null;
  const major = Number(price.amount) / 100;
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: price.currency,
    maximumFractionDigits: 0,
  }).format(major);
}

export function ArtworkCard({
  work,
  priority,
}: {
  work: PublicProductCard;
  /** Первый экран грузится сразу: это метрика LCP, а не удобство. */
  priority?: boolean;
}) {
  const sold = work.status === 'sold';
  const onOrder = work.status === 'on_order';
  const price = formatPrice(work.price);

  return (
    <Link href={`/works/${work.slug}`} className="group block">
      <div className="relative overflow-hidden bg-[var(--bg-subtle)]">
        {work.cover ? (
          <div
            className="transition-opacity duration-200 group-hover:opacity-[0.94]"
            // проданная работа приглушается: внимание уходит к доступным,
            // но сама она остаётся в каталоге и продолжает продавать
            style={sold ? { filter: 'saturate(0.72) brightness(0.98)' } : undefined}
          >
            <BlurImage
              src={work.cover.variants.card.url}
              width={work.cover.variants.card.width}
              height={work.cover.variants.card.height}
              blurhash={work.cover.blurhash}
              alt={work.cover.alt ?? work.title}
              priority={priority}
            />
          </div>
        ) : (
          <div className="aspect-[4/5] w-full" />
        )}

        {/*
          «Нашла свой дом» вместо сухого «Продано»: работа не стала недоступна,
          она уехала к своему человеку. Формулировка из дизайн-системы.
        */}
        {sold && (
          <span
            className="absolute bottom-3.5 left-3.5 px-3 py-1 text-[length:var(--text-lg)] italic backdrop-blur-[2px]"
            style={{
              fontFamily: 'var(--font-serif)',
              color: 'var(--primary-fg)',
              background: 'oklch(0.27 0.013 58 / 0.55)',
            }}
          >
            нашла свой дом
          </span>
        )}

        {onOrder && (
          <span
            className="absolute left-3 top-3 rounded-[var(--radius-sm)] px-2.5 py-1 text-[length:var(--text-2xs)] uppercase"
            style={{
              letterSpacing: 'var(--tracking-caps)',
              background: 'var(--status-order-bg)',
              color: 'var(--status-order)',
            }}
          >
            Под заказ
          </span>
        )}
      </div>

      <div className="mt-2.5">
        {/* работает на ценность: сразу отделяет от маркетплейса */}
        <p className="eyebrow mb-1" style={{ color: 'var(--fg-faint)' }}>
          Единственный экземпляр
        </p>

        <h3 className="text-[length:var(--text-xl)] transition-colors group-hover:text-[var(--primary)]">
          {work.title}
        </h3>

        {/* цена показывается спокойно, без выделения */}
        <p
          className="mt-2 text-[length:var(--text-base)]"
          style={{ color: sold ? 'var(--fg-faint)' : 'var(--fg-body)' }}
        >
          {sold ? 'Продано' : work.priceOnRequest ? 'Цена по запросу' : price}
        </p>
      </div>
    </Link>
  );
}
