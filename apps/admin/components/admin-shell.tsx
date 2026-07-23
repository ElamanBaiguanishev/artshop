'use client';

import { clearToken, getToken } from '@/lib/admin-api';
import { Image, LayoutGrid, LogOut, Package, Settings, Star, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Разделы сайдбара. Активные ведут на готовые страницы, будущие помечены
 * soon и пока не кликаются — место под функционал, который будет расти.
 */
const NAV_GROUPS: {
  title: string;
  items: { href: string; label: string; icon: typeof Package; soon?: boolean }[];
}[] = [
  {
    title: 'Каталог',
    items: [
      { href: '/products', label: 'Работы', icon: Package },
      { href: '/media', label: 'Медиа', icon: Image, soon: true },
    ],
  },
  {
    title: 'Продажи',
    items: [
      { href: '/orders', label: 'Заказы', icon: LayoutGrid },
      { href: '/customers', label: 'Клиенты', icon: Users, soon: true },
      { href: '/reviews', label: 'Отзывы', icon: Star, soon: true },
    ],
  },
  {
    title: 'Система',
    items: [{ href: '/settings', label: 'Настройки', icon: Settings, soon: true }],
  },
];

/**
 * Оболочка админки: полноэкранный layout с сайдбаром, отдельный от витрины.
 * Проверяет вход на клиенте; страница логина выведена из-под проверки.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const isLogin = pathname === '/login';

  useEffect(() => {
    if (isLogin) {
      setReady(true);
      return;
    }
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setReady(true);
  }, [isLogin, router]);

  if (isLogin) return <>{children}</>;
  if (!ready) return null;

  return (
    <div className="flex min-h-dvh bg-[var(--admin-bg)] text-[var(--admin-fg)]">
      {/* сайдбар */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-[var(--admin-border)] bg-[var(--admin-surface)]">
        <div className="flex h-14 items-center gap-2 border-b border-[var(--admin-border)] px-5">
          <span className="text-[length:var(--text-base)] font-[var(--weight-semibold)]">Алия</span>
          <span className="text-[length:var(--text-xs)] text-[var(--admin-muted)]">админка</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="mb-5">
              <p className="mb-1.5 px-2 text-[length:var(--text-2xs)] uppercase tracking-[var(--tracking-caps)] text-[var(--admin-muted)]">
                {group.title}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = pathname.startsWith(item.href);
                  const Icon = item.icon;
                  if (item.soon) {
                    return (
                      <span
                        key={item.href}
                        className="flex cursor-default items-center gap-2.5 rounded-[var(--radius-md)] px-2 py-1.5 text-[length:var(--text-sm)] text-[var(--admin-faint)]"
                      >
                        <Icon size={16} />
                        {item.label}
                        <span className="ml-auto rounded-full bg-[var(--admin-bg)] px-1.5 py-0.5 text-[length:var(--text-2xs)]">
                          скоро
                        </span>
                      </span>
                    );
                  }
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2.5 rounded-[var(--radius-md)] px-2 py-1.5 text-[length:var(--text-sm)] transition-colors"
                      style={{
                        background: active ? 'var(--admin-active-bg)' : 'transparent',
                        color: active ? 'var(--admin-active-fg)' : 'var(--admin-fg)',
                      }}
                    >
                      <Icon size={16} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-[var(--admin-border)] p-3">
          <button
            type="button"
            onClick={() => {
              clearToken();
              router.replace('/login');
            }}
            className="flex w-full items-center gap-2.5 rounded-[var(--radius-md)] px-2 py-1.5 text-[length:var(--text-sm)] text-[var(--admin-muted)] transition-colors hover:text-[var(--admin-fg)]"
          >
            <LogOut size={16} />
            Выйти
          </button>
        </div>
      </aside>

      {/* контент */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
