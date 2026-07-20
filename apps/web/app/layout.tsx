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
  title: {
    default: 'Алия — авторские работы ручной работы',
    template: '%s — Алия',
  },
  description:
    'Живопись маслом, брелоки и декор из эпоксидной смолы. Каждая работа в единственном экземпляре.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${golos.variable} ${spectral.variable}`}>
      <body>{children}</body>
    </html>
  );
}
