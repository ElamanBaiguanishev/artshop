import { z } from 'zod';
import { productKinds } from './catalog';

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

/**
 * Создание работы. Цена в минорных единицах строкой:
 * JSON не умеет bigint, а number на больших суммах теряет точность.
 */
export const createProductRequest = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  kind: z.enum(productKinds).default('painting'),
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
  isFragile: z.boolean().default(false),
  /** Оригинальная живопись и сувениры по-разному проходят таможню. */
  customsCategory: z.enum(['original_art', 'souvenir']).default('original_art'),

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
  /** Что вызвать после успешной заливки, чтобы началась обработка. */
  completeUrl: z.string(),
});

export type UploadUrlResponse = z.infer<typeof uploadUrlResponse>;
