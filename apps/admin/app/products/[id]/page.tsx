'use client';

import { adminApi } from '@/lib/admin-api';
import type { AdminProductDetail } from '@artshop/shared';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ImageUploader } from './image-uploader';

const KIND_LABEL: Record<string, string> = {
  painting: 'Живопись',
  keychain: 'Брелок',
  decor: 'Декор',
};

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<AdminProductDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // поля формы
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [priceOnRequest, setPriceOnRequest] = useState(false);
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [materials, setMaterials] = useState('');
  const [year, setYear] = useState('');
  const [images, setImages] = useState<AdminProductDetail['images']>([]);

  useEffect(() => {
    adminApi.getProduct(id).then((p) => {
      setProduct(p);
      setTitle(p.title);
      setDescription(p.description ?? '');
      // цена приходит в минорных единицах — показываем в основных
      setPrice(p.priceAmount ? String(Number(p.priceAmount) / 100) : '');
      setPriceOnRequest(p.priceOnRequest);
      setWidth(p.widthMm ? String(p.widthMm / 10) : '');
      setHeight(p.heightMm ? String(p.heightMm / 10) : '');
      setMaterials(p.materials?.join(', ') ?? '');
      setYear(p.year ? String(p.year) : '');
      setImages(p.images);
    });
  }, [id]);

  async function save(nextStatus?: 'draft' | 'available' | 'archived') {
    setSaving(true);
    try {
      await adminApi.updateProduct(id, {
        title,
        description: description || undefined,
        // основные единицы -> минорные целым числом
        priceAmount: price ? String(Math.round(Number(price) * 100)) : undefined,
        priceOnRequest,
        widthMm: width ? Math.round(Number(width) * 10) : undefined,
        heightMm: height ? Math.round(Number(height) * 10) : undefined,
        materials: materials
          ? materials
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
        year: year ? Number(year) : undefined,
        ...(nextStatus && { status: nextStatus }),
      });
      const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      setSavedAt(time);
      const fresh = await adminApi.getProduct(id);
      setProduct(fresh);
    } finally {
      setSaving(false);
    }
  }

  if (!product) return <p className="text-muted-foreground">Загрузка…</p>;

  const isPublished = product.status === 'available';
  const hasReadyImage = images.some((i) => i.processingStatus === 'ready');

  return (
    <div className="max-w-2xl">
      <button
        type="button"
        onClick={() => router.push('/products')}
        className="text-[length:var(--text-sm)] text-muted-foreground"
      >
        ← К работам
      </button>

      <div className="mt-3 flex items-center justify-between gap-4">
        <h1 className="text-[length:var(--text-2xl)]">{title || 'Без названия'}</h1>
        <span className="text-[length:var(--text-xs)] uppercase text-muted-foreground">
          {KIND_LABEL[product.kind]} · {isPublished ? 'опубликована' : product.status}
        </span>
      </div>

      <section className="mt-6">
        <p className="mb-2 text-[length:var(--text-sm)] text-muted-foreground">Фотографии</p>
        <ImageUploader productId={id} images={images} onChange={setImages} />
      </section>

      <section className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[length:var(--text-sm)] text-muted-foreground">Название</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="min-h-[var(--tap-min)] rounded-[var(--radius-md)] border border-border bg-[var(--surface-card)] px-4"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[length:var(--text-sm)] text-muted-foreground">Описание</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="rounded-[var(--radius-md)] border border-border bg-[var(--surface-card)] p-4"
          />
        </label>

        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-[length:var(--text-sm)] text-muted-foreground">Цена, ₸</span>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={priceOnRequest}
              inputMode="numeric"
              className="min-h-[var(--tap-min)] rounded-[var(--radius-md)] border border-border bg-[var(--surface-card)] px-4 disabled:opacity-50"
            />
          </label>
          <label className="mt-6 flex items-center gap-2 text-[length:var(--text-sm)]">
            <input
              type="checkbox"
              checked={priceOnRequest}
              onChange={(e) => setPriceOnRequest(e.target.checked)}
            />
            По запросу
          </label>
        </div>

        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-[length:var(--text-sm)] text-muted-foreground">Ширина, см</span>
            <input
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              inputMode="numeric"
              className="min-h-[var(--tap-min)] rounded-[var(--radius-md)] border border-border bg-[var(--surface-card)] px-4"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-[length:var(--text-sm)] text-muted-foreground">Высота, см</span>
            <input
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              inputMode="numeric"
              className="min-h-[var(--tap-min)] rounded-[var(--radius-md)] border border-border bg-[var(--surface-card)] px-4"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[length:var(--text-sm)] text-muted-foreground">
            Материалы через запятую
          </span>
          <input
            value={materials}
            onChange={(e) => setMaterials(e.target.value)}
            placeholder="холст, масло"
            className="min-h-[var(--tap-min)] rounded-[var(--radius-md)] border border-border bg-[var(--surface-card)] px-4"
          />
        </label>

        <label className="flex w-32 flex-col gap-1.5">
          <span className="text-[length:var(--text-sm)] text-muted-foreground">Год</span>
          <input
            value={year}
            onChange={(e) => setYear(e.target.value)}
            inputMode="numeric"
            className="min-h-[var(--tap-min)] rounded-[var(--radius-md)] border border-border bg-[var(--surface-card)] px-4"
          />
        </label>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6">
        <button
          type="button"
          onClick={() => save()}
          disabled={saving}
          className="min-h-[var(--tap-min)] rounded-[var(--radius-md)] border border-border px-5 text-[length:var(--text-sm)] disabled:opacity-60"
        >
          {saving ? 'Сохраняем…' : 'Сохранить'}
        </button>

        {!isPublished ? (
          <button
            type="button"
            onClick={() => save('available')}
            disabled={saving || !hasReadyImage}
            title={hasReadyImage ? '' : 'Добавьте хотя бы одно фото'}
            className="min-h-[var(--tap-min)] rounded-[var(--radius-md)] px-5 text-[length:var(--text-sm)] disabled:opacity-50"
            style={{ background: 'var(--primary)', color: 'var(--primary-fg)' }}
          >
            Опубликовать
          </button>
        ) : (
          <button
            type="button"
            onClick={() => save('archived')}
            disabled={saving}
            className="min-h-[var(--tap-min)] rounded-[var(--radius-md)] px-5 text-[length:var(--text-sm)]"
            style={{ color: 'var(--danger)' }}
          >
            Снять с публикации
          </button>
        )}

        {savedAt && (
          <span className="text-[length:var(--text-xs)] text-muted-foreground">
            Сохранено в {savedAt}
          </span>
        )}

        {isPublished && (
          <a
            href={`/works/${product.slug}`}
            target="_blank"
            rel="noreferrer"
            className="ml-auto text-[length:var(--text-sm)] text-[var(--primary)]"
          >
            Открыть на сайте →
          </a>
        )}
      </div>
    </div>
  );
}
