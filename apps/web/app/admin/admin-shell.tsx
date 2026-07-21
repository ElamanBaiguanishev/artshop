'use client';

import { clearToken, getToken } from '@/lib/admin-api';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV = [
  { href: '/admin/products', label: 'Работы' },
  { href: '/admin/orders', label: 'Заказы' },
];

/**
 * Оболочка админки: проверяет вход на клиенте и рисует навигацию.
 * Страница логина выведена из-под проверки, иначе редирект зациклится.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const isLogin = pathname === '/admin/login';

  useEffect(() => {
    if (isLogin) {
      setReady(true);
      return;
    }
    if (!getToken()) {
      router.replace('/admin/login');
      return;
    }
    setReady(true);
  }, [isLogin, router]);

  if (isLogin) return <>{children}</>;
  if (!ready) return null;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-border bg-[var(--surface-card)]">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <div className="flex items-center gap-6">
            <span
              style={{ fontFamily: 'var(--font-serif)' }}
              className="text-[length:var(--text-lg)]"
            >
              Алия · админка
            </span>
            <nav className="flex gap-4">
              {NAV.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-[length:var(--text-sm)]"
                    style={{ color: active ? 'var(--primary)' : 'var(--fg-muted)' }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <button
            type="button"
            onClick={() => {
              clearToken();
              router.replace('/admin/login');
            }}
            className="text-[length:var(--text-sm)] text-muted-foreground"
          >
            Выйти
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
