import { type Database, productImages, productSlugHistory, products } from '@artshop/db';
import {
  type AdminProductDetail,
  type AdminProductListItem,
  type CreateProductRequest,
  type UpdateProductRequest,
  uniqueSlug,
} from '@artshop/shared';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { DB } from '../../db/db.module';
import { S3Service } from '../media/s3.service';

@Injectable()
export class AdminProductsService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly s3: S3Service,
  ) {}

  async list(): Promise<AdminProductListItem[]> {
    const rows = await this.db.select().from(products).orderBy(desc(products.updatedAt));
    const images = await this.db.select().from(productImages);

    const byProduct = new Map<string, typeof images>();
    for (const img of images) {
      const list = byProduct.get(img.productId) ?? [];
      list.push(img);
      byProduct.set(img.productId, list);
    }

    return rows.map((p) => {
      const imgs = (byProduct.get(p.id) ?? []).sort((a, b) => a.position - b.position);
      const cover = imgs[0];
      const coverThumb = this.thumbUrl(cover?.variants);
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        kind: p.kind as AdminProductListItem['kind'],
        status: p.status as AdminProductListItem['status'],
        priceAmount: p.priceAmount?.toString() ?? null,
        priceCurrency: p.priceCurrency,
        coverThumbUrl: coverThumb,
        imagesCount: imgs.length,
        updatedAt: p.updatedAt.toISOString(),
      };
    });
  }

  async get(id: string): Promise<AdminProductDetail> {
    const [p] = await this.db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!p) throw new NotFoundException('Работа не найдена');

    const imgs = await this.db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(productImages.position);

    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      kind: p.kind as AdminProductDetail['kind'],
      status: p.status as AdminProductDetail['status'],
      priceAmount: p.priceAmount?.toString() ?? null,
      priceCurrency: p.priceCurrency,
      coverThumbUrl: this.thumbUrl(imgs[0]?.variants),
      imagesCount: imgs.length,
      updatedAt: p.updatedAt.toISOString(),
      description: p.description,
      isUnique: p.isUnique,
      priceOnRequest: p.priceOnRequest,
      widthMm: p.widthMm,
      heightMm: p.heightMm,
      depthMm: p.depthMm,
      weightG: p.weightG,
      isFragile: p.isFragile,
      customsCategory: p.customsCategory as AdminProductDetail['customsCategory'],
      materials: p.materials,
      year: p.year,
      images: imgs.map((img) => ({
        id: img.id,
        position: img.position,
        processingStatus:
          img.processingStatus as AdminProductDetail['images'][number]['processingStatus'],
        isInteriorShot: img.isInteriorShot,
        thumbUrl: this.thumbUrl(img.variants),
        blurhash: img.blurhash,
      })),
    };
  }

  async create(dto: CreateProductRequest): Promise<{ id: string }> {
    const slug = dto.slug ? dto.slug : await uniqueSlug(dto.title, (s) => this.slugTaken(s));

    const [created] = await this.db
      .insert(products)
      .values({
        slug,
        title: dto.title,
        description: dto.description,
        kind: dto.kind,
        status: 'draft',
        isUnique: dto.isUnique,
        quantity: dto.quantity,
        priceAmount: dto.priceAmount ? BigInt(dto.priceAmount) : null,
        priceCurrency: dto.priceCurrency,
        priceOnRequest: dto.priceOnRequest,
        widthMm: dto.widthMm,
        heightMm: dto.heightMm,
        depthMm: dto.depthMm,
        weightG: dto.weightG,
        isFragile: dto.isFragile,
        customsCategory: dto.customsCategory,
        materials: dto.materials,
        year: dto.year,
      })
      .returning({ id: products.id });

    return { id: created?.id ?? '' };
  }

  async update(id: string, dto: UpdateProductRequest): Promise<{ id: string }> {
    const [current] = await this.db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!current) throw new NotFoundException('Работа не найдена');

    // смена опубликованного slug: старый адрес обязан отвечать редиректом
    if (dto.slug && dto.slug !== current.slug && current.status !== 'draft') {
      await this.db
        .insert(productSlugHistory)
        .values({ productId: id, slug: current.slug })
        .onConflictDoNothing();
    }

    const publishing = dto.status === 'available' && !current.publishedAt;

    await this.db
      .update(products)
      .set({
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.kind !== undefined && { kind: dto.kind }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.isUnique !== undefined && { isUnique: dto.isUnique }),
        ...(dto.quantity !== undefined && { quantity: dto.quantity }),
        ...(dto.priceAmount !== undefined && {
          priceAmount: dto.priceAmount ? BigInt(dto.priceAmount) : null,
        }),
        ...(dto.priceCurrency !== undefined && { priceCurrency: dto.priceCurrency }),
        ...(dto.priceOnRequest !== undefined && { priceOnRequest: dto.priceOnRequest }),
        ...(dto.widthMm !== undefined && { widthMm: dto.widthMm }),
        ...(dto.heightMm !== undefined && { heightMm: dto.heightMm }),
        ...(dto.depthMm !== undefined && { depthMm: dto.depthMm }),
        ...(dto.weightG !== undefined && { weightG: dto.weightG }),
        ...(dto.isFragile !== undefined && { isFragile: dto.isFragile }),
        ...(dto.customsCategory !== undefined && { customsCategory: dto.customsCategory }),
        ...(dto.materials !== undefined && { materials: dto.materials }),
        ...(dto.year !== undefined && { year: dto.year }),
        ...(publishing && { publishedAt: new Date() }),
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    return { id };
  }

  async deleteImage(imageId: string): Promise<void> {
    await this.db.delete(productImages).where(eq(productImages.id, imageId));
  }

  private async slugTaken(slug: string): Promise<boolean> {
    const [p] = await this.db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);
    if (p) return true;
    const [h] = await this.db
      .select({ id: productSlugHistory.id })
      .from(productSlugHistory)
      .where(eq(productSlugHistory.slug, slug))
      .limit(1);
    return Boolean(h);
  }

  private thumbUrl(variants: unknown): string | null {
    const v = variants as { thumb?: { key?: string } } | null;
    return v?.thumb?.key ? this.s3.publicUrlFor(v.thumb.key) : null;
  }
}
