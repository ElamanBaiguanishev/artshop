'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    router.replace(`/products/${id}`);
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-serif text-2xl">Новая работа</h1>
      <form onSubmit={submit} className="mt-6 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Название</Label>
          <Input
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Закат над степью"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Тип</Label>
          <div className="flex gap-2">
            {KINDS.map((k) => (
              <Button
                key={k.value}
                type="button"
                variant={kind === k.value ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setKind(k.value)}
              >
                {k.label}
              </Button>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={busy} className="mt-1 self-start">
          {busy ? 'Создаём…' : 'Создать и продолжить'}
        </Button>
      </form>
    </div>
  );
}
