/**
 * Локальный сид: генерирует изображения-заглушки, прогоняет их через тот же
 * конвейер, что и настоящие фото (варианты + WebP + blurhash), и заливает в MinIO.
 *
 * Нужен, чтобы увидеть витрину до того, как появятся реальные снимки работ.
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

const works = [
  { key: 'zakat', c1: '#c98a52', c2: '#7d4a2e', w: 1200, h: 1600 },
  { key: 'step', c1: '#8fa47a', c2: '#4a5c46', w: 1600, h: 1200 },
  { key: 'brelok', c1: '#d9b98f', c2: '#8a6a4a', w: 1200, h: 1200 },
];

async function makeSource(work: (typeof works)[number]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${work.w}" height="${work.h}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${work.c1}"/>
      <stop offset="100%" stop-color="${work.c2}"/>
    </linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
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
  for (const work of works) {
    const source = await makeSource(work);
    const variants: Record<string, unknown> = {};

    for (const [name, width] of Object.entries(SIZES)) {
      const pipeline = sharp(source)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 82 });
      const buf = await pipeline.toBuffer();
      const meta = await sharp(buf).metadata();
      const key = `v/${work.key}-${name}.webp`;

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
      console.log(`залито ${key} (${Math.round(buf.length / 1024)} КБ)`);
    }

    const hash = await blurhashOf(source);
    console.log(`${work.key}: blurhash ${hash}`);
    console.log(JSON.stringify(variants));
    console.log('---');
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
