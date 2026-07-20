import {
  bigint,
  boolean,
  char,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Схема этапа 1: каталог, изображения, заказы, админы, outbox.
 * Переводы, отзывы, диалоги и курсы валют добавляются на своих этапах -
 * см. docs/roadmap.md.
 *
 * Соглашения:
 * - деньги всегда целым числом в минорных единицах (тиын/копейка/цент) + код валюты;
 * - ничего не удаляем физически, используем статусы;
 * - временные метки в timestamptz.
 */

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
};

// --- справочники ---

export const productKind = pgEnum('product_kind', ['painting', 'keychain', 'decor', 'other']);

export const productStatus = pgEnum('product_status', [
  'draft',
  'available',
  'reserved',
  'sold',
  'archived',
]);

/** У оригинальной живописи и у сувениров разные правила при отправке за границу. */
export const customsCategory = pgEnum('customs_category', ['original_art', 'souvenir']);

export const imageStatus = pgEnum('image_status', ['pending', 'processing', 'ready', 'failed']);

export const orderType = pgEnum('order_type', ['catalog', 'custom']);

export const orderStatus = pgEnum('order_status', [
  'new',
  'discussing',
  'quoted',
  'agreed',
  'paid',
  'in_progress',
  'shipped',
  'delivered',
  'cancelled',
]);

export const contactChannel = pgEnum('contact_channel', [
  'telegram',
  'whatsapp',
  'instagram',
  'email',
  'phone',
]);

export const adminRole = pgEnum('admin_role', ['owner', 'manager']);

export const outboxStatus = pgEnum('outbox_status', ['pending', 'sent', 'failed']);

// --- каталог ---

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    kind: productKind('kind').notNull().default('painting'),
    status: productStatus('status').notNull().default('draft'),

    title: text('title').notNull(),
    description: text('description'),

    /** Работа в единственном экземпляре: quantity игнорируется. */
    isUnique: boolean('is_unique').notNull().default(true),
    quantity: integer('quantity').notNull().default(1),

    priceAmount: bigint('price_amount', { mode: 'bigint' }),
    priceCurrency: char('price_currency', { length: 3 }).notNull().default('KZT'),
    priceOnRequest: boolean('price_on_request').notNull().default(false),

    widthMm: integer('width_mm'),
    heightMm: integer('height_mm'),
    depthMm: integer('depth_mm'),
    weightG: integer('weight_g'),
    isFragile: boolean('is_fragile').notNull().default(false),
    customsCategory: customsCategory('customs_category').notNull().default('original_art'),

    materials: text('materials').array(),
    year: integer('year'),

    /** Бронь под конкретную заявку. Снимается по истечении срока фоновой задачей. */
    reservedUntil: timestamp('reserved_until', { withTimezone: true }),
    reservedByOrderId: uuid('reserved_by_order_id'),

    publishedAt: timestamp('published_at', { withTimezone: true }),
    soldAt: timestamp('sold_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => ({
    slugIdx: uniqueIndex('products_slug_idx').on(t.slug),
    listingIdx: index('products_listing_idx').on(t.status, t.publishedAt),
  }),
);

export const productImages = pgTable(
  'product_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0),

    originalKey: text('original_key').notNull(),
    /** Производные варианты: { thumb: { key, width, height, format }, ... } */
    variants: jsonb('variants'),
    blurhash: text('blurhash'),
    alt: text('alt'),

    processingStatus: imageStatus('processing_status').notNull().default('pending'),
    processingError: text('processing_error'),

    /** Фото в интерьере: без масштаба картина не читается, такие показываем сразу за первым. */
    isInteriorShot: boolean('is_interior_shot').notNull().default(false),
    ...timestamps,
  },
  (t) => ({
    galleryIdx: index('product_images_gallery_idx').on(t.productId, t.position),
  }),
);

/**
 * Опубликованный slug не меняется: он уже разошёлся по перепискам и проиндексирован.
 * Если правка всё же понадобилась - старый адрес отвечает редиректом 301 на новый.
 */
export const productSlugHistory = pgTable(
  'product_slug_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    replacedAt: timestamp('replaced_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    slugIdx: uniqueIndex('product_slug_history_slug_idx').on(t.slug),
  }),
);

// --- заказы ---

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Человекочитаемый номер, который называют в переписке. */
    number: text('number').notNull(),
    /** Секрет для страницы статуса без регистрации. */
    publicToken: text('public_token').notNull(),

    type: orderType('type').notNull().default('catalog'),
    status: orderStatus('status').notNull().default('new'),

    customerName: text('customer_name').notNull(),
    contactChannel: contactChannel('contact_channel').notNull(),
    contactValue: text('contact_value').notNull(),
    customerComment: text('customer_comment'),

    country: char('country', { length: 2 }),
    displayCurrency: char('display_currency', { length: 3 }),
    /** Курс фиксируется при согласовании, иначе сумма разъезжается с названной в переписке. */
    exchangeRate: text('exchange_rate'),

    itemsAmount: bigint('items_amount', { mode: 'bigint' }),
    shippingAmount: bigint('shipping_amount', { mode: 'bigint' }),
    totalAmount: bigint('total_amount', { mode: 'bigint' }),

    /** Откуда пришёл: instagram / pinterest / direct / utm. */
    source: text('source'),
    /** Заказ, заведённый вручную по разговору вне системы. */
    isManual: boolean('is_manual').notNull().default(false),
    adminNote: text('admin_note'),
    ...timestamps,
  },
  (t) => ({
    numberIdx: uniqueIndex('orders_number_idx').on(t.number),
    publicTokenIdx: uniqueIndex('orders_public_token_idx').on(t.publicToken),
    boardIdx: index('orders_board_idx').on(t.status, t.createdAt),
  }),
);

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),

  /** Снимки на момент заказа: товар потом может измениться или уйти в архив. */
  titleSnapshot: text('title_snapshot').notNull(),
  priceSnapshot: bigint('price_snapshot', { mode: 'bigint' }),
  currencySnapshot: char('currency_snapshot', { length: 3 }),

  /** Спецификация кастомного изделия: имя для гравировки, цвет, размер, референс. */
  customSpec: jsonb('custom_spec'),
  ...timestamps,
});

export const orderEvents = pgTable(
  'order_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    fromStatus: orderStatus('from_status'),
    toStatus: orderStatus('to_status').notNull(),
    note: text('note'),
    actor: text('actor').notNull().default('system'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    orderIdx: index('order_events_order_idx').on(t.orderId, t.createdAt),
  }),
);

// --- админы ---

export const adminUsers = pgTable(
  'admin_users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    name: text('name'),
    role: adminRole('role').notNull().default('manager'),
    /** Для уведомлений: заполняется, когда админ нажал Start у бота. */
    telegramChatId: text('telegram_chat_id'),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => ({
    emailIdx: uniqueIndex('admin_users_email_idx').on(t.email),
  }),
);

// --- outbox ---

/**
 * Всё, что уходит наружу (Telegram, CAPI, письма), пишется сюда в одной транзакции
 * с бизнес-изменением. Отправляет worker. Заявка не должна теряться из-за того,
 * что внешний сервис недоступен.
 */
export const outboxEvents = pgTable(
  'outbox_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    topic: text('topic').notNull(),
    payload: jsonb('payload').notNull(),
    /** Ключ идемпотентности: он же event_id для аналитики. */
    dedupKey: text('dedup_key').notNull(),
    status: outboxStatus('status').notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    nextRetryAt: timestamp('next_retry_at', { withTimezone: true }).defaultNow().notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    dedupIdx: uniqueIndex('outbox_events_dedup_idx').on(t.dedupKey),
    pollIdx: index('outbox_events_poll_idx').on(t.status, t.nextRetryAt),
  }),
);
