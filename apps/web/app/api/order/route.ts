import { type NextRequest, NextResponse } from 'next/server';

/**
 * Прокси заявки к API. Форма шлёт сюда, а не напрямую в API:
 * так внутренний адрес API не светится в браузере, и CORS не нужен.
 */
const API =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3011';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const res = await fetch(`${API}/orders`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });
  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { 'content-type': 'application/json' },
  });
}
