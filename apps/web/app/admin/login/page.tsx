'use client';

import { adminApi, setToken } from '@/lib/admin-api';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { accessToken } = await adminApi.login(email, password);
      setToken(accessToken);
      router.replace('/admin/products');
    } catch {
      setError('Неверная почта или пароль');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <form onSubmit={submit} className="w-full max-w-sm">
        <h1 className="text-[length:var(--text-2xl)]" style={{ fontFamily: 'var(--font-serif)' }}>
          Вход в админку
        </h1>
        <p className="mt-2 text-[length:var(--text-sm)] text-muted-foreground">
          Панель управления работами и заказами.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Почта"
            className="min-h-[var(--tap-min)] rounded-[var(--radius-md)] border border-border bg-[var(--surface-card)] px-4"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            className="min-h-[var(--tap-min)] rounded-[var(--radius-md)] border border-border bg-[var(--surface-card)] px-4"
          />
        </div>

        {error && (
          <p className="mt-3 text-[length:var(--text-sm)]" style={{ color: 'var(--danger)' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-5 min-h-[var(--tap-min)] w-full rounded-[var(--radius-md)] text-[length:var(--text-sm)] disabled:opacity-60"
          style={{ background: 'var(--primary)', color: 'var(--primary-fg)' }}
        >
          {busy ? 'Входим…' : 'Войти'}
        </button>
      </form>
    </div>
  );
}
