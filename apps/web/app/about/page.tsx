import { BlurImage } from '@/components/shop/blur-image';
import { TelegramButton } from '@/components/shop/telegram-button';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Об авторе',
  description: 'Алия — художник из Петропавловска. Живопись маслом с натуры и украшения из смолы.',
};

const MEDIA = 'http://localhost:9000/artshop-media/v';

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-[var(--container)] px-5 py-16 md:px-10 md:py-24">
      <div className="grid gap-10 md:grid-cols-[0.9fr_1fr] md:gap-16">
        <BlurImage
          src={`${MEDIA}/author-full.webp`}
          width={1200}
          height={1500}
          blurhash={null}
          alt="Алия"
          priority
          sizes="(max-width: 768px) 100vw, 45vw"
        />

        <div>
          <p className="eyebrow mb-4">об авторе</p>
          <h1 className="text-[length:var(--text-3xl)]" style={{ fontFamily: 'var(--font-serif)' }}>
            Алия
          </h1>

          <div className="mt-8 flex flex-col gap-5 text-muted-foreground">
            <p>
              Я живу в Петропавловске, на севере Казахстана. Пишу маслом с натуры — в основном
              степь, реку и то, что происходит со светом в первые и последние часы дня.
            </p>
            <p>
              Свет над степью держится минут сорок. За это время нужно взять главное: отношения
              цвета, направление тени, температуру воздуха. Остальное дописываю в мастерской, но
              никогда не выдумываю — только уточняю то, что видела.
            </p>
            <p>
              Кроме живописи делаю украшения и мелкий декор из эпоксидной смолы: брелоки, подставки,
              кулоны с полевыми цветами. Цветы собираю сама в июне, сушу, а потом заливаю — поэтому
              одинаковых не бывает.
            </p>
            <p>
              Работы отправляю по Казахстану, России и в Европу. Живопись упаковываю в жёсткий короб
              с защитой углов, украшения — в коробочку, которую не стыдно подарить.
            </p>
          </div>

          <div className="mt-8">
            <TelegramButton label="Написать мне" />
          </div>
        </div>
      </div>

      <section className="mt-24">
        <h2 className="text-[length:var(--text-2xl)]">Мастерская</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <BlurImage
            src={`${MEDIA}/studio-card.webp`}
            width={900}
            height={600}
            blurhash={null}
            alt="Мастерская"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="flex flex-col justify-center gap-4 text-muted-foreground">
            <p>
              Мастерская — это половина комнаты с северным окном. Северный свет ровный и не меняется
              в течение дня, поэтому цвет на холсте получается таким, каким его увидят у вас дома.
            </p>
            <p>
              Каждую работу показываю на этапах: подмалёвок, основной слой, финиш. Если что-то
              смущает — можно сказать до того, как краска высохнет.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
