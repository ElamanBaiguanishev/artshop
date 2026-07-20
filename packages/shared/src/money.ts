/**
 * Деньги в системе - всегда целое число в минорных единицах плюс код валюты.
 * Никаких float: 0.1 + 0.2 в деньгах недопустимо.
 *
 * 45 000 ₸  -> { amount: 4500000n, currency: 'KZT' }
 * 12.50 EUR -> { amount: 1250n,    currency: 'EUR' }
 */

export type CurrencyCode = 'KZT' | 'RUB' | 'EUR' | 'USD';

export interface Money {
  amount: bigint;
  currency: CurrencyCode;
}

/** Сколько минорных единиц в одной основной. У всех поддерживаемых валют - 100. */
const MINOR_UNITS: Record<CurrencyCode, number> = {
  KZT: 100,
  RUB: 100,
  EUR: 100,
  USD: 100,
};

export function money(amount: bigint | number, currency: CurrencyCode): Money {
  return { amount: BigInt(amount), currency };
}

/** Из основных единиц: fromMajor(45000, 'KZT') -> 4500000n */
export function fromMajor(value: number, currency: CurrencyCode): Money {
  const factor = MINOR_UNITS[currency];
  return { amount: BigInt(Math.round(value * factor)), currency };
}

export function toMajor(value: Money): number {
  return Number(value.amount) / MINOR_UNITS[value.currency];
}

export function formatMoney(value: Money, locale = 'ru-RU'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: value.currency,
    maximumFractionDigits: value.currency === 'KZT' ? 0 : 2,
  }).format(toMajor(value));
}

/**
 * Пересчёт по курсу. Используется только для витрины.
 * В заказе курс фиксируется в момент согласования и потом не пересчитывается.
 */
export function convert(value: Money, rate: number, to: CurrencyCode): Money {
  const majorInTarget = toMajor(value) * rate;
  return fromMajor(majorInTarget, to);
}
