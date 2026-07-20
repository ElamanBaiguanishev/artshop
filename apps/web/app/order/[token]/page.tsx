import { TelegramButton } from '@/components/shop/telegram-button';
import type { Metadata } from 'next';

/** Страница по секретной ссылке: не индексируется и не кешируется. */
export const metadata: Metadata = {
  title: 'Статус заказа',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const STAGES = [
  { key: 'new', label: 'Заявка получена' },
  { key: 'quoted', label: 'Цена и доставка согласованы' },
  { key: 'paid', label: 'Оплачено' },
  { key: 'in_progress', label: 'В работе' },
  { key: 'shipped', label: 'Отправлено' },
  { key: 'delivered', label: 'Доставлено' },
];

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // подключение к ручке статуса появится вместе с модулем заказов
  const order = {
    number: 'A-1042',
    status: 'shipped',
    title: 'Закат над степью',
    total: '52 000 KZT',
    track: 'KZ284519903',
    customer: 'Динара',
  };

  const currentIndex = STAGES.findIndex((s) => s.key === order.status);

  return (
    <main className="mx-auto max-w-[var(--container-read)] px-5 py-16 md:py-24">
      <p className="eyebrow mb-3">заказ {order.number}</p>
      <h1 className="text-[length:var(--text-3xl)]" style={{ fontFamily: 'var(--font-serif)' }}>
        {order.title}
      </h1>
      <p className="mt-3 text-muted-foreground">
        {order.customer}, спасибо за заказ. Здесь всегда актуальный статус — ссылку можно сохранить.
      </p>

      <ol className="mt-10 flex flex-col">
        {STAGES.map((stage, i) => {
          const done = i <= currentIndex;
          return (
            <li key={stage.key} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span
                  className="mt-1.5 size-2.5 rounded-full"
                  style={{ background: done ? 'var(--primary)' : 'var(--border-strong)' }}
                />
                {i < STAGES.length - 1 && (
                  <span
                    className="w-px flex-1"
                    style={{ background: done ? 'var(--primary)' : 'var(--border)' }}
                  />
                )}
              </div>
              <div className="pb-8">
                <p style={{ color: done ? 'var(--fg-strong)' : 'var(--fg-faint)' }}>
                  {stage.label}
                </p>
                {stage.key === 'shipped' && done && (
                  <p className="mt-1 text-[length:var(--text-sm)] text-muted-foreground">
                    Трек-номер: <span className="font-mono">{order.track}</span>
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="rounded-[var(--radius-lg)] border border-border p-5">
        <div className="flex items-baseline justify-between">
          <span className="text-muted-foreground">Итого</span>
          <span className="text-[length:var(--text-lg)]">{order.total}</span>
        </div>
        <p className="mt-4 text-[length:var(--text-sm)] text-muted-foreground">
          Вопрос по заказу? Напишите — отвечу в течение дня.
        </p>
        <div className="mt-4">
          <TelegramButton payload={`order_${token}`} label="Написать о заказе" />
        </div>
      </div>
    </main>
  );
}
