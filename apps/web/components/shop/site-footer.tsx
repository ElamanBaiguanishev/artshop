import Link from 'next/link';
import { TelegramButton } from './telegram-button';

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border py-12">
      <div className="mx-auto flex max-w-[var(--container)] flex-col gap-8 px-5 md:flex-row md:items-start md:justify-between md:px-10">
        <div className="max-w-[36ch]">
          <p className="text-[length:var(--text-xl)]" style={{ fontFamily: 'var(--font-serif)' }}>
            Алия
          </p>
          <p className="mt-3 text-[length:var(--text-sm)] text-muted-foreground">
            Живопись маслом, брелоки и декор из эпоксидной смолы. Петропавловск, Казахстан.
            Отправляю по СНГ и в Европу.
          </p>
        </div>

        <nav className="flex flex-col gap-2 text-[length:var(--text-sm)]">
          <Link href="/works" className="text-muted-foreground hover:text-[var(--primary)]">
            Работы
          </Link>
          <Link href="/about" className="text-muted-foreground hover:text-[var(--primary)]">
            Об авторе
          </Link>
          <Link href="/delivery" className="text-muted-foreground hover:text-[var(--primary)]">
            Доставка и оплата
          </Link>
        </nav>

        <div className="flex flex-col items-start gap-3">
          <TelegramButton />
          <p className="text-[length:var(--text-xs)] text-[var(--fg-faint)]">
            Отвечаю обычно в течение дня
          </p>
        </div>
      </div>
    </footer>
  );
}
