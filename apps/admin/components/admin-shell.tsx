'use client';

import { Button } from '@/components/ui/button';
import { clearToken, getToken } from '@/lib/admin-api';
import { cn } from '@/lib/utils';
import {
  Image,
  LayoutGrid,
  LogOut,
  Moon,
  Package,
  Settings,
  Star,
  Sun,
  Users,
} from 'lucide-react';
import { useTheme } from 'next-themes';
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

/** Переключатель светлой/тёмной темы. */
function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Сменить тему"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {mounted && isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

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
    <div className="flex min-h-dvh bg-background text-foreground">
      {/* сайдбар */}
      <aside className="flex w-60 shrink-0 flex-col border-r bg-card">
        <div className="flex h-14 items-center gap-2 border-b px-5">
          <span className="font-serif text-base font-semibold">artshop</span>
          <span className="text-xs text-muted-foreground">админка</span>
          <div className="ml-auto">
            <ModeToggle />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="mb-5">
              <p className="mb-1.5 px-2 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
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
                        className="flex cursor-default items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground/60"
                      >
                        <Icon className="size-4" />
                        {item.label}
                        <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[0.6875rem] text-muted-foreground">
                          скоро
                        </span>
                      </span>
                    );
                  }
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                        active
                          ? 'bg-accent font-medium text-accent-foreground'
                          : 'text-foreground hover:bg-accent/50',
                      )}
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t p-3">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            onClick={() => {
              clearToken();
              router.replace('/login');
            }}
          >
            <LogOut className="size-4" />
            Выйти
          </Button>
        </div>
      </aside>

      {/* контент */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
