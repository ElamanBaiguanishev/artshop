import { createServer } from 'node:http';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import pino from 'pino';
import { startOutboxLoop } from './outbox.js';

const log = pino({ name: 'worker' });

const databaseUrl = process.env.DATABASE_URL ?? 'postgres://artshop:artshop@localhost:5433/artshop';

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6380', {
  maxRetriesPerRequest: null, // требование BullMQ
});

/**
 * Медиа-очередь на BullMQ: обработка изображений появится вместе с загрузкой
 * фото в админке. Outbox же живёт в Postgres (см. outbox.ts) - задача ставится
 * в одной транзакции с заказом, поэтому отдельный брокер ему не нужен.
 */
export const queues = {
  media: new Queue('media', { connection }),
};

const mediaWorker = new Worker(
  'media',
  async (job) => {
    log.info({ jobId: job.id, name: job.name }, 'media job received');
    // TODO: ресайз, WebP/AVIF, водяной знак, blurhash
  },
  { connection, concurrency: 2 },
);
mediaWorker.on('failed', (job, err) => log.error({ jobId: job?.id, err }, 'media job failed'));

// разбор outbox: уведомления о заказах и прочие внешние отправки
const stopOutbox = startOutboxLoop(databaseUrl, log);

// health для docker healthcheck и мониторинга
createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({
        service: 'worker',
        status: 'ok',
        uptimeSeconds: Math.round(process.uptime()),
        version: '0.0.1',
      }),
    );
    return;
  }
  res.writeHead(404).end();
}).listen(Number(process.env.WORKER_PORT ?? 3002), '0.0.0.0');

log.info('worker started');

async function shutdown() {
  log.info('shutting down');
  stopOutbox();
  await mediaWorker.close();
  await connection.quit();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
