import { TelegramButton } from '@/components/shop/telegram-button';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Доставка и оплата',
  description: 'Как проходит заказ, доставка по Казахстану, России и в Европу.',
};

const STEPS = [
  {
    title: 'Заявка',
    text: 'Оставляете заявку на сайте или пишете в Telegram. Ничего не оплачивается.',
  },
  {
    title: 'Согласование',
    text: 'Обсуждаем работу, считаем доставку до вашего города и договариваемся о сроке.',
  },
  { title: 'Оплата', text: 'Присылаю реквизиты или ссылку. Для заказных работ — половина вперёд.' },
  { title: 'Отправка', text: 'Упаковываю, отправляю и присылаю трек-номер и фото упаковки.' },
];

export default function DeliveryPage() {
  return (
    <main className="mx-auto max-w-[var(--container-read)] px-5 py-16 md:py-24">
      <p className="eyebrow mb-4">как это работает</p>
      <h1 className="text-[length:var(--text-3xl)]" style={{ fontFamily: 'var(--font-serif)' }}>
        Доставка и оплата
      </h1>

      <ol className="mt-10 flex flex-col gap-6">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-4">
            <span
              className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full text-[length:var(--text-xs)]"
              style={{ background: 'var(--primary-tint)', color: 'var(--primary)' }}
            >
              {i + 1}
            </span>
            <div>
              <p className="text-[length:var(--text-lg)]">{step.title}</p>
              <p className="mt-1 text-muted-foreground">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-16">
        <h2 className="text-[length:var(--text-2xl)]">Куда отправляю</h2>
        <div className="mt-6 flex flex-col gap-4 text-muted-foreground">
          <p>
            <strong className="text-[var(--fg-strong)]">Казахстан</strong> — Казпочта или курьер,
            2–5 дней. По Петропавловску можно забрать лично.
          </p>
          <p>
            <strong className="text-[var(--fg-strong)]">Россия и СНГ</strong> — 7–14 дней в
            зависимости от города.
          </p>
          <p>
            <strong className="text-[var(--fg-strong)]">Европа</strong> — 2–4 недели. Живопись
            отправляю в жёстком коробе.
          </p>
        </div>

        <p className="mt-6 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] p-4 text-[length:var(--text-sm)]">
          При доставке за пределы Казахстана таможенные пошлины и НДС оплачивает получатель по
          правилам своей страны. В Европе налог начисляется с первого евро — учитывайте это при
          заказе.
        </p>
      </section>

      <section className="mt-16">
        <h2 className="text-[length:var(--text-2xl)]">Если что-то не так</h2>
        <p className="mt-4 text-muted-foreground">
          Если работа приехала повреждённой — пришлите фото упаковки и работы, разберёмся. Каждая
          отправка застрахована, и я всегда на связи.
        </p>
        <div className="mt-6">
          <TelegramButton label="Задать вопрос" />
        </div>
      </section>
    </main>
  );
}
