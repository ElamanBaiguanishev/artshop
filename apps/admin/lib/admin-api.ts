'use client';

/**
 * Клиент админского API. Токен лежит в localStorage: админка — клиентское
 * приложение под /admin, серверный рендер ей не нужен (noindex, два юзера).
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3011';
const TOKEN_KEY = 'artshop_admin_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Требуется вход');
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status}: ${body}`);
  }
  return res.json();
}

export const adminApi = {
  login: (email: string, password: string) =>
    request<{ accessToken: string; user: { email: string; role: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  listProducts: () => request<import('@artshop/shared').AdminProductListItem[]>('/admin/products'),

  getProduct: (id: string) =>
    request<import('@artshop/shared').AdminProductDetail>(`/admin/products/${id}`),

  createProduct: (dto: import('@artshop/shared').CreateProductRequest) =>
    request<{ id: string }>('/admin/products', { method: 'POST', body: JSON.stringify(dto) }),

  updateProduct: (id: string, dto: import('@artshop/shared').UpdateProductRequest) =>
    request<{ id: string }>(`/admin/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  deleteImage: (imageId: string) =>
    request<{ ok: boolean }>(`/admin/products/images/${imageId}`, { method: 'DELETE' }),

  requestUpload: (dto: import('@artshop/shared').UploadUrlRequest) =>
    request<import('@artshop/shared').UploadUrlResponse>('/admin/media/upload-url', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  completeUpload: (imageId: string) =>
    request<{ ok: boolean }>('/admin/media/complete', {
      method: 'POST',
      body: JSON.stringify({ imageId }),
    }),
};

/** Прямая заливка файла в S3 по presigned URL, минуя наш API. */
export async function uploadToStorage(url: string, file: File): Promise<void> {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'content-type': file.type },
    body: file,
  });
  if (!res.ok) throw new Error(`Загрузка не удалась: ${res.status}`);
}
