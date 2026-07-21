import { z } from 'zod';

/** Контракты между сервисами и фронтом. Растут по мере появления эндпоинтов. */

export const healthResponse = z.object({
  service: z.string(),
  status: z.literal('ok'),
  uptimeSeconds: z.number(),
  version: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponse>;

export const contactChannels = ['telegram', 'whatsapp', 'instagram', 'email', 'phone'] as const;

/** Заявка с карточки работы. Полей намеренно мало: каждое лишнее снижает конверсию. */
export const createOrderRequest = z.object({
  // фронт знает работу по slug, не по uuid; для заявки «просто написать» может быть пусто
  productSlug: z.string().max(120).optional(),
  customerName: z.string().min(1).max(120),
  contactChannel: z.enum(contactChannels),
  contactValue: z.string().min(3).max(200),
  comment: z.string().max(2000).optional(),
  source: z.string().max(200).optional(),
});

export type CreateOrderRequest = z.infer<typeof createOrderRequest>;

export const createOrderResponse = z.object({
  orderNumber: z.string(),
  /** Секретная ссылка на страницу статуса без регистрации. */
  statusUrl: z.string(),
  telegramDeepLink: z.string().optional(),
  /** true, если работа уникальна и уже занята другой заявкой. */
  alreadyReserved: z.boolean().default(false),
});

export type CreateOrderResponse = z.infer<typeof createOrderResponse>;
