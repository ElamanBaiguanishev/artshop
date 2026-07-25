import { type Database, categories, products } from '@artshop/db';
import {
  type AdminCategory,
  type CreateCategoryRequest,
  type UpdateCategoryRequest,
  uniqueSlug,
} from '@artshop/shared';
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq, sql } from 'drizzle-orm';
import { DB } from '../../db/db.module';

@Injectable()
export class AdminCategoriesService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async list(): Promise<AdminCategory[]> {
    const rows = await this.db.select().from(categories).orderBy(asc(categories.position));
    const counts = await this.db
      .select({ categoryId: products.categoryId, n: sql<number>`count(*)::int` })
      .from(products)
      .groupBy(products.categoryId);
    const countById = new Map(counts.map((c) => [c.categoryId, c.n]));

    return rows.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      position: c.position,
      isActive: c.isActive,
      color: c.color,
      customsCategory: c.customsCategory as AdminCategory['customsCategory'],
      isFragileDefault: c.isFragileDefault,
      productsCount: countById.get(c.id) ?? 0,
    }));
  }

  async create(dto: CreateCategoryRequest): Promise<{ id: string }> {
    const slug = dto.slug ? dto.slug : await uniqueSlug(dto.name, (s) => this.slugTaken(s));
    if (dto.slug && (await this.slugTaken(dto.slug))) {
      throw new ConflictException('Такой адрес типа уже занят');
    }

    // новый тип встаёт в конец списка
    const [{ max } = { max: 0 }] = await this.db
      .select({ max: sql<number>`coalesce(max(${categories.position}), 0)::int` })
      .from(categories);

    const [created] = await this.db
      .insert(categories)
      .values({
        slug,
        name: dto.name,
        position: (max ?? 0) + 1,
        color: dto.color,
        customsCategory: dto.customsCategory,
        isFragileDefault: dto.isFragileDefault,
      })
      .returning({ id: categories.id });

    return { id: created?.id ?? '' };
  }

  async update(id: string, dto: UpdateCategoryRequest): Promise<{ id: string }> {
    await this.require(id);
    if (dto.slug && (await this.slugTaken(dto.slug, id))) {
      throw new ConflictException('Такой адрес типа уже занят');
    }

    await this.db
      .update(categories)
      .set({
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.customsCategory !== undefined && { customsCategory: dto.customsCategory }),
        ...(dto.isFragileDefault !== undefined && { isFragileDefault: dto.isFragileDefault }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.position !== undefined && { position: dto.position }),
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id));

    return { id };
  }

  /** Перенос всех товаров типа на другой тип (перед архивом/удалением). */
  async reassign(id: string, toCategoryId: string): Promise<{ moved: number }> {
    if (id === toCategoryId) throw new ConflictException('Нельзя переносить в тот же тип');
    await this.require(id);
    await this.require(toCategoryId);

    const moved = await this.db
      .update(products)
      .set({ categoryId: toCategoryId, updatedAt: new Date() })
      .where(eq(products.categoryId, id))
      .returning({ id: products.id });

    return { moved: moved.length };
  }

  /** Жёсткое удаление — только если типом никто не пользуется. */
  async remove(id: string): Promise<void> {
    await this.require(id);
    const count = await this.productsCount(id);
    if (count > 0) {
      throw new ConflictException(
        `Тип используют ${count} товаров — сначала перенесите их или скройте тип`,
      );
    }
    await this.db.delete(categories).where(eq(categories.id, id));
  }

  private async require(id: string) {
    const [c] = await this.db.select().from(categories).where(eq(categories.id, id)).limit(1);
    if (!c) throw new NotFoundException('Тип не найден');
    return c;
  }

  private async productsCount(id: string): Promise<number> {
    const [{ n } = { n: 0 }] = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(products)
      .where(eq(products.categoryId, id));
    return n ?? 0;
  }

  private async slugTaken(slug: string, exceptId?: string): Promise<boolean> {
    const [c] = await this.db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);
    return Boolean(c && c.id !== exceptId);
  }
}
