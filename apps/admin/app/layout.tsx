import { AdminShell } from '@/components/admin-shell';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import type { Metadata } from 'next';
import { Golos_Text, Spectral } from 'next/font/google';
import './globals.css';

const golos = Golos_Text({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-golos',
  display: 'swap',
});

const spectral = Spectral({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500'],
  variable: '--font-spectral',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'artshop — админка',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${golos.variable} ${spectral.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AdminShell>{children}</AdminShell>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
