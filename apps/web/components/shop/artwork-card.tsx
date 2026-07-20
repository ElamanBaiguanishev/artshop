import type { PublicProductCard } from '@artshop/shared';
import Link from 'next/link';
import { BlurImage } from './blur-image';

const STATUS_LABEL: Record<PublicProductCard['status'], string | null> = {
  available: null,
  sold: 'Продано',
  on_order: 'Под заказ',
};

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
  const label = STATUS_LABEL[work.status];
  const price = formatPrice(work.price);

  return (
    <Link href={`/works/${work.slug}`} className="group block">
      <div className="relative overflow-hidden bg-[var(--bg-subtle)]">
        {work.cover ? (
          <BlurImage
            src={work.cover.variants.card.url}
            width={work.cover.variants.card.width}
            height={work.cover.variants.card.height}
            blurhash={work.cover.blurhash}
            alt={work.cover.alt ?? work.title}
            priority={priority}
          />
        ) : (
          <div className="aspect-[3/4] w-full" />
        )}

        {/* «Продано» — знак того, что работы покупают, а не сообщение об ошибке */}
        {label && (
          <span
            className="absolute left-3 top-3 rounded-[var(--radius-sm)] px-2.5 py-1 text-[length:var(--text-2xs)] uppercase"
            style={{
              letterSpacing: 'var(--tracking-caps)',
              background: work.status === 'sold' ? 'var(--status-sold)' : 'var(--status-order-bg)',
              color: work.status === 'sold' ? 'var(--status-sold-fg)' : 'var(--status-order)',
            }}
          >
            {label}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-4">
        <h3 className="text-[length:var(--text-xl)] transition-colors group-hover:text-[var(--primary)]">
          {work.title}
        </h3>
        {/* цена показывается спокойно, без выделения */}
        <span className="shrink-0 text-[length:var(--text-sm)] text-muted-foreground">
          {work.priceOnRequest ? 'Цена по запросу' : price}
        </span>
      </div>
    </Link>
  );
}
