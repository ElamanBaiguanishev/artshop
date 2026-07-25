'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { adminApi } from '@/lib/admin-api';
import type { AdminCategory } from '@artshop/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Создание — минимум: название и тип. Всё остальное (цена, фото, размеры)
 * заполняется в редакторе, куда сразу перекидываем: так проще с телефона.
 */
export default function NewProductPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [cats, setCats] = useState<AdminCategory[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminApi.listCategories().then((all) => {
      const active = all.filter((c) => c.isActive);
      setCats(active);
      if (active[0]) setCategoryId(active[0].id);
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId) return;
    setBusy(true);
    const { id } = await adminApi.createProduct({
      title,
      categoryId,
      priceCurrency: 'KZT',
      priceOnRequest: false,
      isUnique: true,
      quantity: 1,
    });
    router.replace(`/products/${id}`);
  }

  const noCategories = cats.length === 0;

  return (
    <div className="max-w-lg">
      <h1 className="font-serif text-2xl">Новая работа</h1>

      {noCategories ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Сначала заведите хотя бы один тип товара в разделе{' '}
          <Link href="/categories" className="text-primary hover:underline">
            Типы
          </Link>
          .
        </p>
      ) : (
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
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите тип" />
              </SelectTrigger>
              <SelectContent>
                {cats.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={busy} className="mt-1 self-start">
            {busy ? 'Создаём…' : 'Создать и продолжить'}
          </Button>
        </form>
      )}
    </div>
  );
}
