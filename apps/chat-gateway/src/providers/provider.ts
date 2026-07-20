/**
 * Интерфейс провайдера мессенджера.
 *
 * Спроектирован сразу под несколько мессенджеров: точки расхождения известны
 * заранее (идентификаторы сообщений, способ отдачи медиа, статусы доставки,
 * ограничения на инициативу диалога). Реализация на старте одна - Telegram.
 *
 * Шлюз занимается транспортом, api - смыслом: здесь нет ни слова про заказы.
 */

export type ProviderKind = 'telegram' | 'whatsapp';

export interface AttachmentRef {
  /** Идентификатор файла у провайдера, резолвится через fetchAttachment. */
  ref: string;
  mime?: string;
  sizeBytes?: number;
  fileName?: string;
}

export interface IncomingMessage {
  providerKind: ProviderKind;
  /** Ключ дедупликации: провайдеры повторяют доставку при любой заминке. */
  providerMessageId: string;
  providerChatId: string;
  providerUserId: string;
  customerName?: string;
  text?: string;
  attachments: AttachmentRef[];
  /** Payload из deep link при первом запуске - им диалог связывается с заказом. */
  startPayload?: string;
  sentAt: Date;
}

export interface OutgoingAttachment {
  url: string;
  mime?: string;
  caption?: string;
}

export interface OutgoingMessage {
  providerChatId: string;
  /** Наш идентификатор: делает повторную отправку безопасной. */
  clientMessageId: string;
  text?: string;
  attachments?: OutgoingAttachment[];
}

export interface SendResult {
  providerMessageId?: string;
  sentAt: Date;
}

export interface AttachmentStream {
  stream: NodeJS.ReadableStream;
  mime?: string;
  sizeBytes?: number;
}

export interface ChatProvider {
  readonly kind: ProviderKind;

  /** Разбор входящего обновления в нормализованный вид. */
  parseUpdate(raw: unknown): IncomingMessage[];

  /** Отправка. Идемпотентна по clientMessageId. */
  send(msg: OutgoingMessage): Promise<SendResult>;

  /** Ссылка, по которой покупатель начинает диалог (бот не может написать первым). */
  buildDeepLink(payload: string): string;

  /** Скачивание вложения по идентификатору провайдера. */
  fetchAttachment(ref: string): Promise<AttachmentStream>;
}
