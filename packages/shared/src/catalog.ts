import { z } from 'zod';

/**
 * ПУБЛИЧНОЕ представление работы.
 *
 * Описано отдельной схемой, а не фильтрацией сущности из БД. Это принципиально:
 * у товара есть поля, которых посетитель видеть не должен (внутренние заметки,
 * связанные заказы с контактами покупателей). Отдельный тип не даст им утечь
 * при добавлении новой колонки.
 */

export const productKinds = ['painting', 'keychain', 'decor', 'other'] as const;
export type ProductKind = (typeof productKinds)[number];

export const publicProductStatuses = ['available', 'sold', 'on_order'] as const;
export type PublicProductStatus = (typeof publicProductStatuses)[number];

export const imageVariant = z.object({
  key: z.string(),
  url: z.string(),
  width: z.number(),
  height: z.number(),
});

export const publicImage = z.object({
  variants: z.object({
    thumb: imageVariant,
    card: imageVariant,
    full: imageVariant,
  }),
  blurhash: z.string().nullable(),
  alt: z.string().nullable(),
  /** Кадр в интерьере: показывается сразу за первым, без масштаба работа не читается. */
  isInteriorShot: z.boolean(),
});

export const publicPrice = z.object({
  amount: z.string(), // bigint сериализуется строкой, чтобы не потерять точность
  currency: z.string().length(3),
});

export const publicProductCard = z.object({
  slug: z.string(),
  title: z.string(),
  kind: z.enum(productKinds),
  status: z.enum(publicProductStatuses),
  price: publicPrice.nullable(),
  priceOnRequest: z.boolean(),
  cover: publicImage.nullable(),
});

export const publicProductDetail = publicProductCard.extend({
  description: z.string().nullable(),
  images: z.array(publicImage),
  dimensions: z
    .object({
      widthMm: z.number().nullable(),
      heightMm: z.number().nullable(),
      depthMm: z.number().nullable(),
    })
    .nullable(),
  materials: z.array(z.string()).nullable(),
  year: z.number().nullable(),
});

export type PublicProductCard = z.infer<typeof publicProductCard>;
export type PublicProductDetail = z.infer<typeof publicProductDetail>;

/** Параметры выдачи каталога. Подгрузка курсором, а не страницами. */
export const catalogQuery = z.object({
  kind: z.enum(productKinds).optional(),
  /** Показывать ли проданные. По умолчанию да: они работают как соцдоказательство. */
  includeSold: z.coerce.boolean().default(true),
  limit: z.coerce.number().int().min(1).max(48).default(24),
  cursor: z.string().optional(),
});

export type CatalogQuery = z.infer<typeof catalogQuery>;

export const catalogResponse = z.object({
  items: z.array(publicProductCard),
  nextCursor: z.string().nullable(),
});

export type CatalogResponse = z.infer<typeof catalogResponse>;
