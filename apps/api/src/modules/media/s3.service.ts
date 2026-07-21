import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';

/**
 * Доступ к S3-совместимому хранилищу.
 * Оригиналы грузятся напрямую по presigned URL, минуя API: восьмимегабайтные
 * файлы не должны идти через приложение.
 */
@Injectable()
export class S3Service {
  private readonly client = new S3Client({
    endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
    region: process.env.S3_REGION ?? 'us-east-1',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY ?? 'artshop',
      secretAccessKey: process.env.S3_SECRET_KEY ?? 'artshop123',
    },
    forcePathStyle: true, // MinIO без virtual-hosted стиля
  });

  private readonly bucket = process.env.S3_BUCKET ?? 'artshop-media';
  private readonly publicUrl = process.env.S3_PUBLIC_URL ?? 'http://localhost:9000/artshop-media';

  /** Ссылка на прямую загрузку оригинала. Живёт 15 минут. */
  async presignUpload(key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn: 900 });
  }

  publicUrlFor(key: string): string {
    return `${this.publicUrl}/${key}`;
  }
}
