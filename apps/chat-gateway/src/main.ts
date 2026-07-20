import { createServer } from 'node:http';
import pino from 'pino';

const log = pino({ name: 'chat-gateway' });

/**
 * Этап 1: только health. Бот и вебхуки появляются на этапе 2 -
 * см. docs/chat-gateway.md.
 */
const port = Number(process.env.CHAT_GATEWAY_PORT ?? 3003);

createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({
        service: 'chat-gateway',
        status: 'ok',
        uptimeSeconds: Math.round(process.uptime()),
        version: '0.0.1',
      }),
    );
    return;
  }
  res.writeHead(404).end();
}).listen(port, '0.0.0.0');

log.info({ port }, 'chat-gateway started');
