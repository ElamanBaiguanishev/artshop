import type { CatalogResponse, PublicProductDetail } from '@artshop/shared';

/**
 * Обращения с сервера идут по внутреннему адресу (в докере - по сети),
 * минуя публичный домен: короче путь и не тратится TLS.
 */
const BASE =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3011';

export async function fetchCatalog(params?: {
  kind?: string;
  includeSold?: boolean;
}): Promise<CatalogResponse> {
  const query = new URLSearchParams();
  if (params?.kind) query.set('kind', params.kind);
  if (params?.includeSold === false) query.set('includeSold', 'false');

  const res = await fetch(`${BASE}/catalog?${query}`, {
    // ISR: страница статична, но раз в минуту пересобирается; плюс
    // ревалидация по событию из админки при публикации работы
    next: { revalidate: 60, tags: ['catalog'] },
  });
  if (!res.ok) throw new Error(`Каталог недоступен: ${res.status}`);
  return res.json();
}

export async function fetchWork(slug: string): Promise<PublicProductDetail | null> {
  const res = await fetch(`${BASE}/catalog/${slug}`, {
    next: { revalidate: 60, tags: ['catalog', `work:${slug}`] },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Работа недоступна: ${res.status}`);
  return res.json();
}
