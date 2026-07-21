import { randomBytes } from 'node:crypto';

/**
 * Человекочитаемый номер заказа: A-1042. Называется в переписке, поэтому короткий.
 * Год в префиксе, чтобы номера не путались между сезонами.
 */
export function makeOrderNumber(seq: number): string {
  return `A-${seq}`;
}

/**
 * Секрет для страницы статуса без регистрации. Длинный и случайный:
 * по короткому или последовательному можно перебором вычитать чужие заказы.
 */
export function makePublicToken(): string {
  return randomBytes(24).toString('base64url');
}
