'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { adminApi } from '@/lib/admin-api';
import type { AdminProductDetail } from '@artshop/shared';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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
      const fresh = await adminApi.getProduct(id);
      setProduct(fresh);
      toast.success(
        nextStatus === 'available'
          ? 'Работа опубликована'
          : nextStatus === 'archived'
            ? 'Снята с публикации'
            : 'Сохранено',
      );
    } catch {
      toast.error('Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }

  if (!product) return <p className="text-muted-foreground">Загрузка…</p>;

  const isPublished = product.status === 'available';
  const hasReadyImage = images.some((i) => i.processingStatus === 'ready');

  return (
    <div className="max-w-2xl">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 text-muted-foreground"
        onClick={() => router.push('/products')}
      >
        <ArrowLeft className="size-4" />К работам
      </Button>

      <div className="mt-3 flex items-center justify-between gap-4">
        <h1 className="font-serif text-2xl">{title || 'Без названия'}</h1>
        <Badge variant="outline" className="shrink-0">
          {KIND_LABEL[product.kind]} · {isPublished ? 'опубликована' : product.status}
        </Badge>
      </div>

      <section className="mt-6">
        <p className="mb-2 text-sm text-muted-foreground">Фотографии</p>
        <ImageUploader productId={id} images={images} onChange={setImages} />
      </section>

      <section className="mt-8 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Название</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Описание</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        <div className="flex items-end gap-4">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="price">Цена, ₸</Label>
            <Input
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={priceOnRequest}
              inputMode="numeric"
            />
          </div>
          <Label className="flex h-9 items-center gap-2 font-normal">
            <Checkbox
              checked={priceOnRequest}
              onCheckedChange={(v) => setPriceOnRequest(v === true)}
            />
            По запросу
          </Label>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="width">Ширина, см</Label>
            <Input
              id="width"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              inputMode="numeric"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="height">Высота, см</Label>
            <Input
              id="height"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              inputMode="numeric"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="materials">Материалы через запятую</Label>
          <Input
            id="materials"
            value={materials}
            onChange={(e) => setMaterials(e.target.value)}
            placeholder="холст, масло"
          />
        </div>

        <div className="flex w-32 flex-col gap-1.5">
          <Label htmlFor="year">Год</Label>
          <Input
            id="year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            inputMode="numeric"
          />
        </div>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t pt-6">
        <Button variant="outline" onClick={() => save()} disabled={saving}>
          {saving ? 'Сохраняем…' : 'Сохранить'}
        </Button>

        {!isPublished ? (
          <Button
            onClick={() => save('available')}
            disabled={saving || !hasReadyImage}
            title={hasReadyImage ? '' : 'Добавьте хотя бы одно фото'}
          >
            Опубликовать
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => save('archived')}
            disabled={saving}
          >
            Снять с публикации
          </Button>
        )}

        {isPublished && (
          <a
            href={`/works/${product.slug}`}
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            Открыть на сайте
            <ExternalLink className="size-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
