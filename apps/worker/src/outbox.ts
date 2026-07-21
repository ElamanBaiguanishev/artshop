import { createDb, outboxEvents } from '@artshop/db';
import { and, eq, lte, sql } from 'drizzle-orm';
import type { Logger } from 'pino';

/**
 * Разбор outbox: берём накопившиеся события и отправляем наружу.
 *
 * Событие пишется в БД в одной транзакции с бизнес-изменением (создание заказа),
 * поэтому здесь оно гарантированно есть, даже если процесс падал. Ретраи с
 * возрастающей задержкой; после исчерпания попыток помечаем failed и не трогаем.
 */

const MAX_ATTEMPTS = 6;
const BATCH = 20;

export function startOutboxLoop(databaseUrl: string, log: Logger) {
  const db = createDb(databaseUrl);
  let stopped = false;

  async function tick() {
    const due = await db
      .select()
      .from(outboxEvents)
      .where(and(eq(outboxEvents.status, 'pending'), lte(outboxEvents.nextRetryAt, new Date())))
      .limit(BATCH);

    for (const event of due) {
      try {
        await deliver(event.topic, event.payload, log);
        await db
          .update(outboxEvents)
          .set({ status: 'sent', sentAt: new Date() })
          .where(eq(outboxEvents.id, event.id));
      } catch (err) {
        const attempts = event.attempts + 1;
        const failed = attempts >= MAX_ATTEMPTS;
        // задержка растёт: 1, 2, 4, 8... минут
        const delayMs = 2 ** event.attempts * 60_000;
        await db
          .update(outboxEvents)
          .set({
            attempts,
            status: failed ? 'failed' : 'pending',
            lastError: err instanceof Error ? err.message : String(err),
            nextRetryAt: new Date(Date.now() + delayMs),
          })
          .where(eq(outboxEvents.id, event.id));
        log.warn({ topic: event.topic, attempts, failed }, 'outbox delivery failed');
      }
    }
  }

  const timer = setInterval(() => {
    if (!stopped) void tick().catch((err) => log.error({ err }, 'outbox tick error'));
  }, 3000);

  return () => {
    stopped = true;
    clearInterval(timer);
  };
}

/**
 * Отправка события во внешнюю систему. Пока Telegram — заглушка в лог:
 * реальный бот подключится, когда появится токен (chat-gateway, этап 2).
 */
async function deliver(topic: string, payload: unknown, log: Logger) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  const p = payload as Record<string, unknown>;
  const text = renderMessage(topic, p);

  if (!token || !chatId) {
    // нет бота - просто логируем, чтобы видеть, что уведомление сформировалось
    log.info({ topic, text }, 'notification (no bot configured, logged only)');
    return;
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
  if (!res.ok) throw new Error(`telegram ${res.status}: ${await res.text()}`);
}

function renderMessage(topic: string, p: Record<string, unknown>): string {
  if (topic === 'order.created') {
    const lines = [
      `🎨 <b>Новая заявка ${p.number}</b>`,
      p.productTitle ? `Работа: ${p.productTitle}` : 'Заказ без привязки к работе',
      `Имя: ${p.customerName}`,
      `Связь: ${p.contactChannel} — ${p.contactValue}`,
    ];
    if (p.comment) lines.push(`Комментарий: ${p.comment}`);
    if (p.alreadyReserved) lines.push('⚠️ Работа уже была занята другой заявкой');
    return lines.join('\n');
  }
  return `Событие: ${topic}`;
}
