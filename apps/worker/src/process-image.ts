import { createDb, productImages } from '@artshop/db';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { encode } from 'blurhash';
import { eq } from 'drizzle-orm';
import type { Logger } from 'pino';
import sharp from 'sharp';

/**
 * Обработка загруженной фотографии: из оригинала делаем варианты под витрину.
 * Тот же конвейер, что и в сид-скрипте, только источник — реальная загрузка.
 */

const SIZES = { thumb: 400, card: 900, full: 1800 } as const;

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
  region: process.env.S3_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY ?? 'artshop',
    secretAccessKey: process.env.S3_SECRET_KEY ?? 'artshop123',
  },
  forcePathStyle: true,
});

const BUCKET = process.env.S3_BUCKET ?? 'artshop-media';
const PUBLIC = process.env.S3_PUBLIC_URL ?? 'http://localhost:9000/artshop-media';
const db = createDb(
  process.env.DATABASE_URL ?? 'postgres://artshop:artshop@localhost:5433/artshop',
);

async function download(key: string): Promise<Buffer> {
  const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const chunks: Buffer[] = [];
  for await (const chunk of res.Body as AsyncIterable<Buffer>) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function blurhashOf(buf: Buffer): Promise<string> {
  const { data, info } = await sharp(buf)
    .raw()
    .ensureAlpha()
    .resize(32, 32, { fit: 'inside' })
    .toBuffer({ resolveWithObject: true });
  return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4);
}

export async function processImage(
  imageId: string,
  originalKey: string,
  log: Logger,
): Promise<void> {
  try {
    // автоповорот по EXIF: фото с телефона иначе приезжают боком
    const source = await sharp(await download(originalKey))
      .rotate()
      .toBuffer();

    const variants: Record<string, unknown> = {};
    for (const [name, width] of Object.entries(SIZES)) {
      const pipeline = sharp(source).resize({ width, withoutEnlargement: true });
      // водяной знак только на полноразмерном
      if (name === 'full') {
        pipeline.composite([
          {
            input: Buffer.from(
              `<svg width="240" height="40"><text x="0" y="28" font-family="sans-serif" font-size="22" fill="white" fill-opacity="0.35">artshop · handmade</text></svg>`,
            ),
            gravity: 'southeast',
          },
        ]);
      }
      const buf = await pipeline.webp({ quality: 82 }).toBuffer();
      const meta = await sharp(buf).metadata();
      const key = originalKey.replace(/^orig\//, 'v/').replace(/\.[^.]+$/, `-${name}.webp`);

      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: buf,
          ContentType: 'image/webp',
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );

      variants[name] = { key, url: `${PUBLIC}/${key}`, width: meta.width, height: meta.height };
    }

    await db
      .update(productImages)
      .set({ variants, blurhash: await blurhashOf(source), processingStatus: 'ready' })
      .where(eq(productImages.id, imageId));

    log.info({ imageId }, 'image processed');
  } catch (err) {
    await db
      .update(productImages)
      .set({
        processingStatus: 'failed',
        processingError: err instanceof Error ? err.message : String(err),
      })
      .where(eq(productImages.id, imageId));
    log.error({ imageId, err }, 'image processing failed');
    throw err; // пусть BullMQ отработает ретрай
  }
}
