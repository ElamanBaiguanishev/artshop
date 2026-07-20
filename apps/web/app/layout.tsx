import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
