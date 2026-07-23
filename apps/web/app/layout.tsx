import type { Metadata } from 'next';
import { Golos_Text, Spectral } from 'next/font/google';
import './globals.css';

/*
  Корневой layout: только каркас документа и шрифты.
  Оформление сайта (шапка, подвал) живёт в (shop)/layout.tsx,
  админка (сайдбар, на весь экран) — в admin/layout.tsx.
  Так витрина и админка не мешают друг другу.
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
  openGraph: { type: 'website', locale: 'ru_RU', siteName: 'Алия' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${golos.variable} ${spectral.variable}`}>
      <body>{children}</body>
    </html>
  );
}
