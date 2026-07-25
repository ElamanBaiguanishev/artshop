import { Send } from 'lucide-react';

const BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT ?? 'artshop_bot';

/**
 * Кнопка связи. Бот не может написать первым - разговор начинает покупатель,
 * поэтому ссылка ведёт в бота с payload, по которому диалог свяжется с работой.
 */
export function telegramLink(payload?: string) {
  return payload ? `https://t.me/${BOT}?start=${payload}` : `https://t.me/${BOT}`;
}

export function TelegramButton({
  payload,
  label = 'Написать в Telegram',
  variant = 'solid',
}: {
  payload?: string;
  label?: string;
  variant?: 'solid' | 'ghost';
}) {
  const solid = variant === 'solid';
  return (
    <a
      href={telegramLink(payload)}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-[var(--tap-min)] items-center justify-center gap-2 rounded-[var(--radius-md)] px-5 text-[length:var(--text-sm)] transition-colors"
      style={
        solid
          ? { background: 'var(--telegram)', color: 'var(--primary-fg)' }
          : { border: '1px solid var(--border-strong)', color: 'var(--fg-body)' }
      }
    >
      <Send size={16} />
      {label}
    </a>
  );
}
