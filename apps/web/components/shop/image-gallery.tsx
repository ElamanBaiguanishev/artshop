'use client';

import type { PublicProductDetail } from '@artshop/shared';
import { useState } from 'react';
import { BlurImage } from './blur-image';

type Img = PublicProductDetail['images'][number];

/**
 * Галерея работы. Кадр «в интерьере» показывается сразу после основного:
 * без понимания масштаба картина не покупается - это главная причина отказа.
 * Переключателя нет, когда фото одно: пустая кнопка хуже её отсутствия.
 */
export function ImageGallery({ images, title }: { images: Img[]; title: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const current = images[active];

  if (!current) return <div className="aspect-[4/5] w-full bg-[var(--bg-subtle)]" />;

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setZoom((z) => !z)}
        className="relative block w-full cursor-zoom-in overflow-hidden"
        aria-label={zoom ? 'Уменьшить' : 'Увеличить'}
      >
        <div
          className="transition-transform duration-500"
          style={{ transform: zoom ? 'scale(1.6)' : 'scale(1)' }}
        >
          <BlurImage
            src={current.variants.full.url}
            width={current.variants.full.width}
            height={current.variants.full.height}
            blurhash={current.blurhash}
            alt={current.alt ?? title}
            priority
            sizes="(max-width: 1024px) 100vw, 60vw"
          />
        </div>

        {current.isInteriorShot && (
          <span
            className="absolute bottom-3 left-3 rounded-[var(--radius-sm)] px-2.5 py-1 text-[length:var(--text-2xs)] uppercase backdrop-blur-[2px]"
            style={{
              letterSpacing: 'var(--tracking-caps)',
              background: 'oklch(0.27 0.013 58 / 0.5)',
              color: 'var(--primary-fg)',
            }}
          >
            в интерьере
          </span>
        )}
      </button>

      {images.length > 1 && (
        <div className="flex gap-3">
          {images.map((img, i) => (
            <button
              key={img.variants.thumb.key}
              type="button"
              onClick={() => setActive(i)}
              className="w-20 shrink-0 transition-opacity"
              style={{ opacity: i === active ? 1 : 0.55 }}
              aria-label={img.isInteriorShot ? 'Кадр в интерьере' : `Кадр ${i + 1}`}
            >
              <BlurImage
                src={img.variants.thumb.url}
                width={img.variants.thumb.width}
                height={img.variants.thumb.height}
                blurhash={img.blurhash}
                alt=""
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
