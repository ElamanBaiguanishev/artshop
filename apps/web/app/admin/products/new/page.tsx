'use client';

import { adminApi } from '@/lib/admin-api';
import type { ProductKind } from '@artshop/shared';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const KINDS: { value: ProductKind; label: string }[] = [
  { value: 'painting', label: 'Живопись' },
  { value: 'keychain', label: 'Брелок' },
  { value: 'decor', label: 'Декор' },
];

/**
 * Создание — минимум: название и тип. Всё остальное (цена, фото, размеры)
 * заполняется в редакторе, куда сразу перекидываем: так проще с телефона.
 */
export default function NewProductPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<ProductKind>('painting');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { id } = await adminApi.createProduct({
      title,
      kind,
      priceCurrency: 'KZT',
      priceOnRequest: false,
      isUnique: true,
      quantity: 1,
      isFragile: kind === 'painting',
      customsCategory: kind === 'painting' ? 'original_art' : 'souvenir',
    });
    router.replace(`/admin/products/${id}`);
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-[length:var(--text-2xl)]">Новая работа</h1>
      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[length:var(--text-sm)] text-muted-foreground">Название</span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Закат над степью"
            className="min-h-[var(--tap-min)] rounded-[var(--radius-md)] border border-border bg-[var(--surface-card)] px-4"
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-[length:var(--text-sm)] text-muted-foreground">Тип</span>
          <div className="flex gap-2">
            {KINDS.map((k) => (
              <button
                key={k.value}
                type="button"
                onClick={() => setKind(k.value)}
                className="min-h-[var(--tap-min)] flex-1 rounded-[var(--radius-md)] border text-[length:var(--text-sm)]"
                style={{
                  borderColor: kind === k.value ? 'var(--primary)' : 'var(--border)',
                  background: kind === k.value ? 'var(--primary-tint)' : 'transparent',
                  color: kind === k.value ? 'var(--primary)' : 'var(--fg-muted)',
                }}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="mt-2 min-h-[var(--tap-min)] rounded-[var(--radius-md)] text-[length:var(--text-sm)] disabled:opacity-60"
          style={{ background: 'var(--primary)', color: 'var(--primary-fg)' }}
        >
          {busy ? 'Создаём…' : 'Создать и продолжить'}
        </button>
      </form>
    </div>
  );
}
