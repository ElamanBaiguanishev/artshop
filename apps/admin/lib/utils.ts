import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Склейка классов: clsx решает условия, tailwind-merge гасит конфликты Tailwind. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
