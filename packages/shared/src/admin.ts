import { z } from 'zod';

/** Контракты админки. Отдельно от публичных: здесь видно всё. */

export const loginRequest = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginRequest = z.infer<typeof loginRequest>;

export const loginResponse = z.object({
  accessToken: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string().nullable(),
    role: z.enum(['owner', 'manager']),
  }),
});

export type LoginResponse = z.infer<typeof loginResponse>;

export const productStatuses = ['draft', 'available', 'reserved', 'sold', 'archived'] as const;

export const customsCategories = ['original_art', 'souvenir'] as const;

// --- типы товаров (управляемый справочник) ---

export const adminCategory = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  position: z.number(),
  isActive: z.boolean(),
  color: z.string().nullable(),
  customsCategory: z.enum(customsCategories),
  isFragileDefault: z.boolean(),
  /** Сколько товаров этого типа — нужно для правил архива/удаления. */
  productsCount: z.number(),
});
export type AdminCategory = z.infer<typeof adminCategory>;

export const createCategoryRequest = z.object({
  name: z.string().min(1).max(60),
  /** Свой адрес; если не задан — генерируется транслитом из названия. */
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Только строчные латинские буквы, цифры и дефис')
    .max(60)
    .optional(),
  color: z.string().max(60).optional(),
  customsCategory: z.enum(customsCategories).default('souvenir'),
  isFragileDefault: z.boolean().default(false),
});
export type CreateCategoryRequest = z.infer<typeof createCategoryRequest>;

export const updateCategoryRequest = z.object({
  name: z.string().min(1).max(60).optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Только строчные латинские буквы, цифры и дефис')
    .max(60)
    .optional(),
  color: z.string().max(60).nullable().optional(),
  customsCategory: z.enum(customsCategories).optional(),
  isFragileDefault: z.boolean().optional(),
  /** Мягкое удаление: скрыть/вернуть тип. */
  isActive: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});
export type UpdateCategoryRequest = z.infer<typeof updateCategoryRequest>;

/** Перенос товаров с одного типа на другой (перед архивом/удалением). */
export const reassignCategoryRequest = z.object({
  toCategoryId: z.string().uuid(),
});
export type ReassignCategoryRequest = z.infer<typeof reassignCategoryRequest>;

/**
 * Создание работы. Цена в минорных единицах строкой:
 * JSON не умеет bigint, а number на больших суммах теряет точность.
 */
export const createProductRequest = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  /** Тип товара — id из справочника categories. */
  categoryId: z.string().uuid(),
  /** Свой адрес; если не задан - генерируется транслитом из названия. */
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Только строчные латинские буквы, цифры и дефис')
    .max(80)
    .optional(),

  priceAmount: z.string().regex(/^\d+$/).optional(),
  priceCurrency: z.string().length(3).default('KZT'),
  priceOnRequest: z.boolean().default(false),

  isUnique: z.boolean().default(true),
  quantity: z.number().int().min(0).default(1),

  widthMm: z.number().int().positive().optional(),
  heightMm: z.number().int().positive().optional(),
  depthMm: z.number().int().positive().optional(),
  weightG: z.number().int().positive().optional(),
  /** Если не заданы — берутся из дефолтов типа (categories). */
  isFragile: z.boolean().optional(),
  /** Оригинальная живопись и сувениры по-разному проходят таможню. */
  customsCategory: z.enum(customsCategories).optional(),

  materials: z.array(z.string().max(60)).max(12).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
});

export type CreateProductRequest = z.infer<typeof createProductRequest>;

export const updateProductRequest = createProductRequest.partial().extend({
  status: z.enum(productStatuses).optional(),
});

export type UpdateProductRequest = z.infer<typeof updateProductRequest>;

/** Запрос ссылки на прямую загрузку файла в хранилище, минуя API. */
export const uploadUrlRequest = z.object({
  productId: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  contentType: z.string().regex(/^image\/(jpeg|png|webp|avif|heic)$/),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(30 * 1024 * 1024),
  isInteriorShot: z.boolean().default(false),
});

export type UploadUrlRequest = z.infer<typeof uploadUrlRequest>;

export const uploadUrlResponse = z.object({
  imageId: z.string(),
  uploadUrl: z.string(),
  /** Ключ оригинала в хранилище — передаётся обратно при подтверждении. */
  storageKey: z.string(),
});

export type UploadUrlResponse = z.infer<typeof uploadUrlResponse>;

/** Подтверждение: файл залит, можно ставить в обработку. */
export const completeUploadRequest = z.object({
  imageId: z.string().uuid(),
});

export type CompleteUploadRequest = z.infer<typeof completeUploadRequest>;

// --- админское представление работы ---

export const adminImage = z.object({
  id: z.string(),
  position: z.number(),
  processingStatus: z.enum(['pending', 'processing', 'ready', 'failed']),
  isInteriorShot: z.boolean(),
  thumbUrl: z.string().nullable(),
  blurhash: z.string().nullable(),
});

export const adminProductListItem = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  category: z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    color: z.string().nullable(),
  }),
  status: z.enum(productStatuses),
  priceAmount: z.string().nullable(),
  priceCurrency: z.string(),
  coverThumbUrl: z.string().nullable(),
  imagesCount: z.number(),
  updatedAt: z.string(),
});

export type AdminProductListItem = z.infer<typeof adminProductListItem>;

export const adminProductDetail = adminProductListItem.extend({
  description: z.string().nullable(),
  isUnique: z.boolean(),
  priceOnRequest: z.boolean(),
  widthMm: z.number().nullable(),
  heightMm: z.number().nullable(),
  depthMm: z.number().nullable(),
  weightG: z.number().nullable(),
  isFragile: z.boolean(),
  customsCategory: z.enum(['original_art', 'souvenir']),
  materials: z.array(z.string()).nullable(),
  year: z.number().nullable(),
  images: z.array(adminImage),
});

export type AdminProductDetail = z.infer<typeof adminProductDetail>;
