import { createServer } from 'node:http';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import pino from 'pino';

const log = pino({ name: 'worker' });

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6380', {
  maxRetriesPerRequest: null, // требование BullMQ
});

/**
 * Очереди этапа 1. Обработчики появляются вместе с соответствующими фичами -
 * см. docs/roadmap.md.
 */
export const queues = {
  media: new Queue('media', { connection }),
  outbox: new Queue('outbox', { connection }),
};

const workers = [
  new Worker(
    'media',
    async (job) => {
      log.info({ jobId: job.id, name: job.name }, 'media job received');
      // TODO этап 1: ресайз, WebP/AVIF, водяной знак, blurhash
    },
    { connection, concurrency: 2 },
  ),

  new Worker(
    'outbox',
    async (job) => {
      log.info({ jobId: job.id, name: job.name }, 'outbox job received');
      // TODO этап 1: разбор outbox_events, отправка в Telegram
    },
    { connection, concurrency: 5 },
  ),
];

for (const w of workers) {
  w.on('failed', (job, err) => log.error({ jobId: job?.id, err }, 'job failed'));
}

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
  await Promise.all(workers.map((w) => w.close()));
  await connection.quit();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
