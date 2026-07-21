import { randomUUID } from 'node:crypto';
import { type Database, productImages, products } from '@artshop/db';
import type { UploadUrlRequest, UploadUrlResponse } from '@artshop/shared';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { eq } from 'drizzle-orm';
import IORedis from 'ioredis';
import { DB } from '../../db/db.module';
import { S3Service } from './s3.service';

/**
 * Загрузка фотографий работ.
 *
 * Поток: админка просит ссылку -> заливает оригинал прямо в S3 ->
 * подтверждает -> ставим задачу в очередь -> воркер делает варианты.
 */
@Injectable()
export class MediaService {
  private readonly queue: Queue;

  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly s3: S3Service,
  ) {
    const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6380', {
      maxRetriesPerRequest: null,
    });
    this.queue = new Queue('media', { connection });
  }

  /** Выдаёт presigned URL и заранее заводит запись изображения в статусе pending. */
  async requestUpload(dto: UploadUrlRequest): Promise<UploadUrlResponse> {
    const [product] = await this.db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, dto.productId))
      .limit(1);
    if (!product) throw new NotFoundException('Работа не найдена');

    const ext = dto.fileName.split('.').pop()?.toLowerCase() ?? 'jpg';
    const storageKey = `orig/${dto.productId}/${randomUUID()}.${ext}`;

    // порядок = число уже существующих изображений
    const existing = await this.db
      .select({ id: productImages.id })
      .from(productImages)
      .where(eq(productImages.productId, dto.productId));

    const [image] = await this.db
      .insert(productImages)
      .values({
        productId: dto.productId,
        position: existing.length,
        originalKey: storageKey,
        isInteriorShot: dto.isInteriorShot,
        processingStatus: 'pending',
      })
      .returning({ id: productImages.id });

    const uploadUrl = await this.s3.presignUpload(storageKey, dto.contentType);

    return { imageId: image?.id ?? '', uploadUrl, storageKey };
  }

  /** Файл залит — ставим в обработку. */
  async completeUpload(imageId: string): Promise<void> {
    const [image] = await this.db
      .select()
      .from(productImages)
      .where(eq(productImages.id, imageId))
      .limit(1);
    if (!image) throw new NotFoundException('Изображение не найдено');

    await this.db
      .update(productImages)
      .set({ processingStatus: 'processing' })
      .where(eq(productImages.id, imageId));

    await this.queue.add(
      'process-image',
      { imageId, originalKey: image.originalKey },
      // идемпотентность: повторное подтверждение не создаст вторую задачу.
      // jobId без двоеточия — BullMQ его запрещает.
      { jobId: `img-${imageId}`, attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );
  }
}
