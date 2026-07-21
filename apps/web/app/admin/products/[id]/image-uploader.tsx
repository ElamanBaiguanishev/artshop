'use client';

import { adminApi, uploadToStorage } from '@/lib/admin-api';
import type { AdminProductDetail } from '@artshop/shared';
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
          <div
            key={img.id}
            className="relative size-28 overflow-hidden rounded-[var(--radius-md)] bg-[var(--bg-subtle)]"
          >
            {img.thumbUrl ? (
              <img src={img.thumbUrl} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-[length:var(--text-2xs)] text-muted-foreground">
                {img.processingStatus === 'failed' ? 'ошибка' : 'обработка…'}
              </div>
            )}
            <button
              type="button"
              onClick={() => remove(img.id)}
              className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full text-[length:var(--text-xs)]"
              style={{ background: 'oklch(0.27 0.013 58 / 0.6)', color: 'white' }}
              aria-label="Удалить"
            >
              ×
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex size-28 items-center justify-center rounded-[var(--radius-md)] border border-dashed border-border text-[length:var(--text-sm)] text-muted-foreground disabled:opacity-60"
        >
          {uploading ? 'Загрузка…' : '+ Фото'}
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
      <p className="mt-2 text-[length:var(--text-xs)] text-muted-foreground">
        Первое фото — обложка. Снимок в интерьере показывается покупателю вторым.
      </p>
    </div>
  );
}
