'use client';

import { decode } from 'blurhash';
import Image from 'next/image';
import { useEffect, useRef } from 'react';

/**
 * Изображение, проявляющееся из размытой заглушки.
 *
 * Спиннера нет намеренно: вместо серого прямоугольника человек сразу видит
 * композицию и цвет работы, а страница не дёргается при подгрузке.
 *
 * Заглушка лежит ПОД изображением и просто перекрывается им по мере загрузки.
 * Раньше здесь было состояние loaded с переключением прозрачности по onLoad -
 * и это ломалось: изображение из кеша успевает загрузиться до навешивания
 * обработчика, событие не приходит, работа остаётся невидимой навсегда.
 * Без состояния такой гонки просто нет.
 *
 * unoptimized - варианты и форматы готовит воркер заранее, повторно
 * пережимать их средствами Next значит тратить CPU сервера впустую.
 */
export function BlurImage({
  src,
  width,
  height,
  blurhash,
  alt,
  priority,
  sizes = '(max-width: 768px) 100vw, 33vw',
}: {
  src: string;
  width: number;
  height: number;
  blurhash: string | null;
  alt: string;
  priority?: boolean;
  sizes?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!blurhash || !canvasRef.current) return;
    const pixels = decode(blurhash, 32, 32);
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.createImageData(32, 32);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);
  }, [blurhash]);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {blurhash && (
        <canvas
          ref={canvasRef}
          width={32}
          height={32}
          aria-hidden
          className="absolute inset-0 size-full scale-110 blur-xl"
        />
      )}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized
        className="relative object-cover"
      />
    </div>
  );
}
