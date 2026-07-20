import { SiteFooter } from '@/components/shop/site-footer';
import { SiteHeader } from '@/components/shop/site-header';
import type { Metadata } from 'next';
import { Golos_Text, Spectral } from 'next/font/google';
import './globals.css';

/*
  Шрифты из дизайн-системы, но self-hosted через next/font:
  файлы едут с нашего домена, без обращения к Google при первой отрисовке.
  display: swap - текст виден сразу, не ждёт загрузки начертания.
*/
const golos = Golos_Text({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-golos',
  display: 'swap',
});

const spectral = Spectral({
  subsets: ['cyrillic', 'latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-spectral',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Алия — авторские работы ручной работы',
    template: '%s — Алия',
  },
  description:
    'Живопись маслом, брелоки и декор из эпоксидной смолы. Каждая работа в единственном экземпляре.',
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'Алия',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${golos.variable} ${spectral.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
