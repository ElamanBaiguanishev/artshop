'use client';

import { adminApi, uploadToStorage } from '@/lib/admin-api';
import type { AdminProductDetail } from '@artshop/shared';
import { Plus, X } from 'lucide-react';
import { useRef, useState } from 'react';

type Img = AdminProductDetail['images'][number];

/**
 * Загрузка фото: presigned URL -> прямая заливка в S3 -> подтверждение ->
 * опрос статуса, пока воркер делает варианты. Всё видно наглядно.
 */
export function ImageUploader({
  productId,
  images: initial,
  onChange,
}: {
  productId: string;
  images: Img[];
  onChange: (images: Img[]) => void;
}) {
  const [images, setImages] = useState<Img[]>(initial);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function update(next: Img[]) {
    setImages(next);
    onChange(next);
  }

  async function pollUntilReady(imageId: string) {
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      const detail = await adminApi.getProduct(productId);
      const img = detail.images.find((x) => x.id === imageId);
      if (img && img.processingStatus !== 'processing' && img.processingStatus !== 'pending') {
        update(detail.images);
        return;
      }
      update(detail.images);
    }
  }

  async function handleFiles(files: FileList) {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const { imageId, uploadUrl } = await adminApi.requestUpload({
          productId,
          fileName: file.name,
          contentType: file.type as 'image/jpeg',
          sizeBytes: file.size,
          isInteriorShot: false,
        });
        await uploadToStorage(uploadUrl, file);
        await adminApi.completeUpload(imageId);
        await pollUntilReady(imageId);
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function remove(imageId: string) {
    await adminApi.deleteImage(imageId);
    update(images.filter((i) => i.id !== imageId));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((img) => (
          <div key={img.id} className="relative size-28 overflow-hidden rounded-md bg-muted">
            {img.thumbUrl ? (
              <img src={img.thumbUrl} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-[0.6875rem] text-muted-foreground">
                {img.processingStatus === 'failed' ? 'ошибка' : 'обработка…'}
              </div>
            )}
            <button
              type="button"
              onClick={() => remove(img.id)}
              className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-foreground/60 text-background transition-colors hover:bg-foreground/80"
              aria-label="Удалить"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex size-28 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-input text-sm text-muted-foreground transition-colors hover:bg-accent/50 disabled:opacity-60"
        >
          {uploading ? (
            'Загрузка…'
          ) : (
            <>
              <Plus className="size-5" />
              Фото
            </>
          )}
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Первое фото — обложка. Снимок в интерьере показывается покупателю вторым.
      </p>
    </div>
  );
}
