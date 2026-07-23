import { ArtworkCard } from '@/components/shop/artwork-card';
import { BlurImage } from '@/components/shop/blur-image';
import { TelegramButton } from '@/components/shop/telegram-button';
import { fetchCatalog } from '@/lib/api';
import Link from 'next/link';

export const revalidate = 60;

/** Отзывы пока статичны: таблица появится вместе с админкой отзывов. */
const REVIEWS = [
  {
    author: 'Динара',
    city: 'Астана',
    text: 'Картина приехала в идеальной упаковке. В жизни цвет теплее, чем на фото — висит в спальне, и утром комната совсем другая.',
  },
  {
    author: 'Марина',
    city: 'Прага',
    text: 'Заказывала брелок с именем дочери в подарок. Мне присылали фото на каждом этапе, дошло за три недели.',
  },
  {
    author: 'Сергей',
    city: 'Алматы',
    text: 'Долго выбирал между двумя работами, мне помогли примерить обе в интерьере по фото. Ни разу не пожалел.',
  },
];

export default async function HomePage() {
  const { items } = await fetchCatalog();
  const hero = items.find((w) => w.status === 'available' && w.cover);
  const fresh = items.filter((w) => w.slug !== hero?.slug).slice(0, 6);
  const available = items.filter((w) => w.status === 'available').length;

  return (
    <main>
      {/* первый экран: одна работа во всю ширину */}
      {hero?.cover && (
        <section className="relative">
          <div className="mx-auto grid max-w-[var(--container)] gap-8 px-5 py-12 md:grid-cols-[1.3fr_1fr] md:items-center md:gap-16 md:px-10 md:py-20">
            <Link href={`/works/${hero.slug}`} className="block">
              <BlurImage
                src={hero.cover.variants.full.url}
                width={hero.cover.variants.full.width}
                height={hero.cover.variants.full.height}
                blurhash={hero.cover.blurhash}
                alt={hero.cover.alt ?? hero.title}
                priority
                sizes="(max-width: 768px) 100vw, 60vw"
              />
            </Link>

            <div>
              <p className="eyebrow mb-4">авторские работы</p>
              <h1
                className="text-[length:var(--text-4xl)]"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Живопись, которая
                <br />
                остаётся с домом
              </h1>
              <p className="mt-6 max-w-[38ch] text-[length:var(--text-lg)] text-muted-foreground">
                Пишу маслом с натуры под Петропавловском и делаю украшения из смолы. Каждая работа
                существует в единственном экземпляре.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/works"
                  className="inline-flex min-h-[var(--tap-min)] items-center rounded-[var(--radius-md)] px-6 text-[length:var(--text-sm)] transition-colors"
                  style={{ background: 'var(--primary)', color: 'var(--primary-fg)' }}
                >
                  Смотреть работы
                </Link>
                <TelegramButton variant="ghost" label="Написать автору" />
              </div>

              <p className="mt-6 text-[length:var(--text-sm)] text-[var(--fg-faint)]">
                Сейчас в наличии {available}{' '}
                {available === 1 ? 'работа' : available < 5 ? 'работы' : 'работ'}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* новое */}
      <section className="mx-auto max-w-[var(--container)] px-5 py-16 md:px-10 md:py-24">
        <div className="flex items-baseline justify-between gap-6">
          <h2 className="text-[length:var(--text-2xl)]">Недавние работы</h2>
          <Link
            href="/works"
            className="text-[length:var(--text-sm)] text-muted-foreground hover:text-[var(--primary)]"
          >
            Весь каталог →
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {fresh.map((work, i) => (
            <ArtworkCard key={work.slug} work={work} priority={i < 3} />
          ))}
        </div>
      </section>

      {/* об авторе */}
      <section style={{ background: 'var(--bg-subtle)' }}>
        <div className="mx-auto grid max-w-[var(--container)] gap-10 px-5 py-16 md:grid-cols-[0.8fr_1fr] md:items-center md:gap-16 md:px-10 md:py-24">
          <BlurImage
            src="http://localhost:9000/artshop-media/v/author-card.webp"
            width={900}
            height={1125}
            blurhash={null}
            alt="В мастерской"
            sizes="(max-width: 768px) 100vw, 40vw"
          />
          <div>
            <p className="eyebrow mb-4">об авторе</p>
            <h2
              className="text-[length:var(--text-2xl)]"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Пишу с натуры, потому что степь не повторяется
            </h2>
            <p className="mt-6 text-muted-foreground">
              Я живу в Петропавловске, пишу маслом и делаю украшения из эпоксидной
              смолы. Свет над степью держится сорок минут, и за это время нужно успеть главное —
              остальное дописываю в мастерской.
            </p>
            <Link
              href="/about"
              className="mt-6 inline-block text-[length:var(--text-sm)] text-[var(--primary)]"
            >
              Подробнее об авторе →
            </Link>
          </div>
        </div>
      </section>

      {/* отзывы */}
      <section className="mx-auto max-w-[var(--container)] px-5 py-16 md:px-10 md:py-24">
        <h2 className="text-[length:var(--text-2xl)]">Отзывы</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {REVIEWS.map((review) => (
            <figure key={review.author} className="border-l-2 border-[var(--border)] pl-5">
              <blockquote
                className="text-[length:var(--text-base)]"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                {review.text}
              </blockquote>
              <figcaption className="mt-4 text-[length:var(--text-sm)] text-muted-foreground">
                {review.author}, {review.city}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </main>
  );
}
