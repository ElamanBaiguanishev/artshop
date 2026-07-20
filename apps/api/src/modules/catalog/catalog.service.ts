import { type Database, productImages, productSlugHistory, products } from '@artshop/db';
import type { CatalogQuery, CatalogResponse, PublicProductDetail } from '@artshop/shared';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, inArray, lt, ne } from 'drizzle-orm';
import { DB } from '../../db/db.module';
import { toCard, toDetail } from './catalog.mapper';

@Injectable()
export class CatalogService {
  constructor(@Inject(DB) private readonly db: Database) {}

  /**
   * Выдача каталога. Курсорная подгрузка, а не offset:
   * при добавлении работы во время просмотра offset сдвигает выдачу
   * и посетитель видит дубли.
   */
  async list(query: CatalogQuery): Promise<CatalogResponse> {
    const visible = query.includeSold
      ? inArray(products.status, ['available', 'reserved', 'sold'])
      : inArray(products.status, ['available', 'reserved']);

    const rows = await this.db
      .select()
      .from(products)
      .where(
        and(
          visible,
          query.kind ? eq(products.kind, query.kind) : undefined,
          query.cursor ? lt(products.publishedAt, new Date(query.cursor)) : undefined,
        ),
      )
      .orderBy(desc(products.publishedAt))
      .limit(query.limit + 1); // +1, чтобы понять, есть ли следующая страница

    const hasMore = rows.length > query.limit;
    const page = hasMore ? rows.slice(0, query.limit) : rows;

    const images = page.length
      ? await this.db
          .select()
          .from(productImages)
          .where(
            and(
              inArray(
                productImages.productId,
                page.map((p) => p.id),
              ),
              eq(productImages.processingStatus, 'ready'),
            ),
          )
          .orderBy(asc(productImages.position))
      : [];

    const byProduct = new Map<string, typeof images>();
    for (const img of images) {
      const list = byProduct.get(img.productId) ?? [];
      list.push(img);
      byProduct.set(img.productId, list);
    }

    const last = page.at(-1);
    return {
      items: page.map((p) => toCard(p, byProduct.get(p.id) ?? [])),
      nextCursor: hasMore && last?.publishedAt ? last.publishedAt.toISOString() : null,
    };
  }

  /**
   * Карточка работы по slug.
   * Если slug устаревший - отдаём признак редиректа: опубликованный адрес
   * уже разошёлся по перепискам и проиндексирован, ронять его нельзя.
   */
  async getBySlug(
    slug: string,
  ): Promise<{ product: PublicProductDetail } | { redirectTo: string }> {
    const [row] = await this.db
      .select()
      .from(products)
      .where(and(eq(products.slug, slug), ne(products.status, 'draft')))
      .limit(1);

    if (!row) {
      const [old] = await this.db
        .select({ productId: productSlugHistory.productId })
        .from(productSlugHistory)
        .where(eq(productSlugHistory.slug, slug))
        .limit(1);

      if (old) {
        const [current] = await this.db
          .select({ slug: products.slug })
          .from(products)
          .where(eq(products.id, old.productId))
          .limit(1);
        if (current) return { redirectTo: current.slug };
      }

      throw new NotFoundException('Работа не найдена');
    }

    if (row.status === 'archived') throw new NotFoundException('Работа не найдена');

    const images = await this.db
      .select()
      .from(productImages)
      .where(and(eq(productImages.productId, row.id), eq(productImages.processingStatus, 'ready')))
      .orderBy(asc(productImages.position));

    return { product: toDetail(row, images) };
  }

  /** Все опубликованные slug - для sitemap.xml и генерации статических страниц. */
  async listSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
    return this.db
      .select({ slug: products.slug, updatedAt: products.updatedAt })
      .from(products)
      .where(inArray(products.status, ['available', 'reserved', 'sold']))
      .orderBy(desc(products.publishedAt));
  }
}
