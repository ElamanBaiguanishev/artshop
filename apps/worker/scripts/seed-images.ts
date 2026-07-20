/**
 * Локальный сид: генерирует изображения-заглушки, прогоняет их через тот же
 * конвейер, что и настоящие фото (варианты + WebP + blurhash), и заливает в MinIO.
 *
 * Нужен, чтобы собрать витрину до появления реальных снимков работ.
 * Выводит готовый SQL для наполнения каталога.
 *   pnpm --filter @artshop/worker seed:images
 */
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { encode } from 'blurhash';
import sharp from 'sharp';

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
  region: process.env.S3_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY ?? 'artshop',
    secretAccessKey: process.env.S3_SECRET_KEY ?? 'artshop123',
  },
  forcePathStyle: true, // MinIO не умеет virtual-hosted стиль без настройки DNS
});

const BUCKET = process.env.S3_BUCKET ?? 'artshop-media';
const PUBLIC = process.env.S3_PUBLIC_URL ?? 'http://localhost:9000/artshop-media';

/** Размеры вариантов. Те же, что будет делать настоящий обработчик. */
const SIZES = { thumb: 400, card: 900, full: 1800 } as const;

type Kind = 'art' | 'interior' | 'portrait';

interface Shot {
  key: string;
  kind: Kind;
  c1: string;
  c2: string;
  w: number;
  h: number;
}

/** Живопись - вертикальная, брелоки - квадрат, интерьер - горизонталь. */
const shots: Shot[] = [
  { key: 'zakat', kind: 'art', c1: '#d09a5c', c2: '#7a4529', w: 1200, h: 1600 },
  { key: 'zakat-room', kind: 'interior', c1: '#e8e0d4', c2: '#c9b9a3', w: 1600, h: 1200 },
  { key: 'tuman', kind: 'art', c1: '#a8b8a4', c2: '#4e5f52', w: 1200, h: 1600 },
  { key: 'tuman-room', kind: 'interior', c1: '#e5e5df', c2: '#bfc2b8', w: 1600, h: 1200 },
  { key: 'step', kind: 'art', c1: '#c9b072', c2: '#6e6236', w: 1600, h: 1200 },
  { key: 'mak', kind: 'art', c1: '#c8695a', c2: '#6d2f2c', w: 1200, h: 1600 },
  { key: 'gory', kind: 'art', c1: '#8e9db4', c2: '#3f4a5e', w: 1600, h: 1200 },
  { key: 'brelok-kot', kind: 'art', c1: '#dcc09a', c2: '#8b6a45', w: 1200, h: 1200 },
  { key: 'brelok-cvet', kind: 'art', c1: '#d5a8b4', c2: '#83566a', w: 1200, h: 1200 },
  { key: 'podstavka', kind: 'art', c1: '#b9c4b0', c2: '#5f6d5c', w: 1200, h: 1200 },
  { key: 'author', kind: 'portrait', c1: '#d8c3ab', c2: '#8a7357', w: 1200, h: 1500 },
  { key: 'studio', kind: 'interior', c1: '#e0d5c3', c2: '#a9977c', w: 1600, h: 1067 },
];

/**
 * Заглушки различимы между собой: градиент плюс мазки, чтобы на сетке
 * не выглядело как двенадцать одинаковых прямоугольников.
 */
async function makeSource(shot: Shot) {
  const strokes = Array.from({ length: 7 }, (_, i) => {
    const y = (shot.h / 8) * (i + 1);
    const opacity = 0.06 + (i % 3) * 0.04;
    const w = shot.w * (0.5 + ((i * 7) % 5) / 10);
    return `<rect x="${shot.w * 0.05}" y="${y}" width="${w}" height="${shot.h / 40}" fill="#fff" opacity="${opacity}"/>`;
  }).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${shot.w}" height="${shot.h}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="${shot.c1}"/>
      <stop offset="100%" stop-color="${shot.c2}"/>
    </linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    ${strokes}
  </svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toBuffer();
}

async function blurhashOf(buf: Buffer) {
  const { data, info } = await sharp(buf)
    .raw()
    .ensureAlpha()
    .resize(32, 32, { fit: 'inside' })
    .toBuffer({ resolveWithObject: true });
  return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4);
}

async function main() {
  const result: Record<string, { variants: unknown; blurhash: string }> = {};

  for (const shot of shots) {
    const source = await makeSource(shot);
    const variants: Record<string, unknown> = {};

    for (const [name, width] of Object.entries(SIZES)) {
      const buf = await sharp(source)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      const meta = await sharp(buf).metadata();
      const key = `v/${shot.key}-${name}.webp`;

      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: buf,
          ContentType: 'image/webp',
          // имя файла меняется вместе с содержимым, поэтому кешируем навсегда
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );

      variants[name] = { key, url: `${PUBLIC}/${key}`, width: meta.width, height: meta.height };
    }

    result[shot.key] = { variants, blurhash: await blurhashOf(source) };
    console.log(`готово ${shot.key}`);
  }

  console.log(`\n${JSON.stringify(result)}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
