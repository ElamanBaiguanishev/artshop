import type { Metadata } from 'next';
import { AdminShell } from './admin-shell';

/** Админка не индексируется: индексировать нечего. */
export const metadata: Metadata = {
  title: 'Админка',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
