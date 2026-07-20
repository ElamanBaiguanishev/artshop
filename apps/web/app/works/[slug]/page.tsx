import { ArtworkCard } from '@/components/shop/artwork-card';
import { ImageGallery } from '@/components/shop/image-gallery';
import { RequestForm } from '@/components/shop/request-form';
import { TelegramButton } from '@/components/shop/telegram-button';
import { fetchCatalog, fetchWork } from '@/lib/api';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const work = await fetchWork(slug);
  if (!work) return {};

  const cover = work.images[0];
  return {
    title: work.title,
    description: work.description ?? undefined,
    openGraph: {
      title: work.title,
      description: work.description ?? undefined,
      // ссылка в мессенджере должна разворачиваться карточкой с фото:
      // отсюда идёт основной трафик
      images: cover ? [{ url: cover.variants.card.url }] : undefined,
    },
  };
}

function formatPrice(price: { amount: string; currency: string } | null) {
  if (!price) return null;
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: price.currency,
    maximumFractionDigits: 0,
  }).format(Number(price.amount) / 100);
}

export default async function WorkPage({ params }: Props) {
  const { slug } = await params;
  const work = await fetchWork(slug);
  if (!work) notFound();

  const { items } = await fetchCatalog();
  const similar = items.filter((w) => w.slug !== work.slug && w.kind === work.kind).slice(0, 3);

  const sold = work.status === 'sold';
  const price = formatPrice(work.price);
  const size = work.dimensions
    ? [work.dimensions.widthMm, work.dimensions.heightMm]
        .filter(Boolean)
        .map((mm) => Math.round((mm as number) / 10))
        .join(' × ')
    : null;

  /* Разметка для поисковика: цена и наличие показываются прямо в выдаче. */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: work.title,
    description: work.description,
    image: work.images.map((i) => i.variants.full.url),
    offers: {
      '@type': 'Offer',
      price: work.price ? Number(work.price.amount) / 100 : undefined,
      priceCurrency: work.price?.currency,
      availability: sold ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
    },
  };

  return (
    <main className="mx-auto max-w-[var(--container)] px-5 py-10 md:px-10 md:py-16">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: разметка Schema.org
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/works"
        className="text-[length:var(--text-sm)] text-muted-foreground hover:text-[var(--primary)]"
      >
        ← Все работы
      </Link>

      {/*
        Десктоп: галерея слева липкая, информация справа.
        Работы вертикальные, во всю ширину не помещаются в экран,
        а цена и кнопка должны оставаться на виду.
      */}
      <div className="mt-6 grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:items-start lg:gap-16">
        <div className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
          <ImageGallery images={work.images} title={work.title} />
        </div>

        <div>
          <p className="eyebrow mb-3">
            {work.kind === 'painting' ? 'живопись' : work.kind === 'keychain' ? 'брелок' : 'декор'}
            {' · единственный экземпляр'}
          </p>

          <h1 className="text-[length:var(--text-3xl)]" style={{ fontFamily: 'var(--font-serif)' }}>
            {work.title}
          </h1>

          <dl className="mt-6 flex flex-col gap-2 text-[length:var(--text-sm)]">
            {size && (
              <div className="flex gap-3">
                <dt className="w-28 shrink-0 text-[var(--fg-faint)]">Размер</dt>
                <dd>{size} см</dd>
              </div>
            )}
            {work.materials?.length && (
              <div className="flex gap-3">
                <dt className="w-28 shrink-0 text-[var(--fg-faint)]">Материалы</dt>
                <dd>{work.materials.join(', ')}</dd>
              </div>
            )}
            {work.year && (
              <div className="flex gap-3">
                <dt className="w-28 shrink-0 text-[var(--fg-faint)]">Год</dt>
                <dd>{work.year}</dd>
              </div>
            )}
          </dl>

          {work.description && <p className="mt-8 text-muted-foreground">{work.description}</p>}

          <div className="mt-10 border-t border-border pt-6">
            {sold ? (
              <div>
                <p
                  className="text-[length:var(--text-xl)] italic"
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  Эта работа нашла свой дом
                </p>
                <p className="mt-3 text-[length:var(--text-sm)] text-muted-foreground">
                  Могу написать похожую или сообщить, когда появится работа в этом настроении.
                </p>
                <div className="mt-5">
                  <TelegramButton payload={`wait_${work.slug}`} label="Хочу похожую" />
                </div>
              </div>
            ) : (
              <div>
                {/* цена показывается спокойно, без выделения */}
                <p className="text-[length:var(--text-xl)]">
                  {work.priceOnRequest ? 'Цена по запросу' : price}
                </p>
                <p className="mt-2 text-[length:var(--text-sm)] text-[var(--fg-faint)]">
                  Доставку считаем отдельно — зависит от города и способа отправки.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <RequestForm workSlug={work.slug} workTitle={work.title} />
                  <TelegramButton payload={`work_${work.slug}`} variant="ghost" />
                </div>
              </div>
            )}
          </div>

          <div className="mt-10 rounded-[var(--radius-lg)] bg-[var(--bg-subtle)] p-5">
            <p className="eyebrow mb-2">как это делалось</p>
            <p className="text-[length:var(--text-sm)] text-muted-foreground">
              Работа написана с натуры за несколько сеансов. Холст на подрамнике, покрыт финишным
              лаком — не выгорает и не боится влажности. Отправляю в жёсткой упаковке с защитой
              углов.
            </p>
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-24">
          <h2 className="text-[length:var(--text-2xl)]">Похожие работы</h2>
          <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((w) => (
              <ArtworkCard key={w.slug} work={w} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
