'use client';

import { useState } from 'react';
import { telegramLink } from './telegram-button';

/**
 * Заявка на покупку. Полей намеренно минимум - каждое лишнее снижает конверсию.
 * Ничего не оплачивается: цена и доставка согласуются в переписке.
 */
export function RequestForm({ workSlug, workTitle }: { workSlug: string; workTitle: string }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [comment, setComment] = useState('');
  const [channel, setChannel] = useState<'telegram' | 'whatsapp' | 'email'>('telegram');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // отправка появится вместе с ручкой заказов; сейчас показываем результат
    setSent(true);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[var(--tap-min)] items-center justify-center rounded-[var(--radius-md)] px-6 text-[length:var(--text-sm)] transition-colors"
        style={{ background: 'var(--primary)', color: 'var(--primary-fg)' }}
      >
        Написать о покупке
      </button>
    );
  }

  if (sent) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-border p-5">
        <p style={{ fontFamily: 'var(--font-serif)' }} className="text-[length:var(--text-lg)]">
          Заявка отправлена
        </p>
        <p className="mt-2 text-[length:var(--text-sm)] text-muted-foreground">
          Алия свяжется с вами и расскажет про доставку. Обычно отвечает в течение дня.
        </p>
        <a
          href={telegramLink(`work_${workSlug}`)}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block text-[length:var(--text-sm)] text-[var(--primary)]"
        >
          Написать сразу в Telegram →
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="w-full rounded-[var(--radius-lg)] border border-border p-5">
      <p className="eyebrow mb-1">заявка</p>
      <p className="text-[length:var(--text-sm)] text-muted-foreground">
        «{workTitle}». Ничего не оплачивается — цену и доставку обсудим в переписке.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Как к вам обращаться"
          className="min-h-[var(--tap-min)] rounded-[var(--radius-md)] border border-border bg-[var(--surface-card)] px-4 text-[length:var(--text-base)]"
        />

        <div className="flex gap-2">
          {(['telegram', 'whatsapp', 'email'] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setChannel(c)}
              className="min-h-[var(--tap-min)] flex-1 rounded-[var(--radius-md)] border text-[length:var(--text-sm)] capitalize transition-colors"
              style={{
                borderColor: channel === c ? 'var(--primary)' : 'var(--border)',
                color: channel === c ? 'var(--primary)' : 'var(--fg-muted)',
                background: channel === c ? 'var(--primary-tint)' : 'transparent',
              }}
            >
              {c === 'email' ? 'Почта' : c}
            </button>
          ))}
        </div>

        <input
          required
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder={channel === 'email' ? 'Ваша почта' : 'Номер или @ник'}
          className="min-h-[var(--tap-min)] rounded-[var(--radius-md)] border border-border bg-[var(--surface-card)] px-4 text-[length:var(--text-base)]"
        />

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Вопрос или пожелание (необязательно)"
          rows={3}
          className="rounded-[var(--radius-md)] border border-border bg-[var(--surface-card)] p-4 text-[length:var(--text-base)]"
        />
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="submit"
          className="min-h-[var(--tap-min)] flex-1 rounded-[var(--radius-md)] text-[length:var(--text-sm)]"
          style={{ background: 'var(--primary)', color: 'var(--primary-fg)' }}
        >
          Отправить заявку
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="min-h-[var(--tap-min)] px-4 text-[length:var(--text-sm)] text-muted-foreground"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
