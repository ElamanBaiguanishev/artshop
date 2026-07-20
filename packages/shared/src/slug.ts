/**
 * Генерация slug из названия работы.
 *
 * Транслит, а не кириллица: кириллический адрес при копировании превращается
 * в %D0%BA%D0%B0%D1%80... - и именно это уезжает в мессенджер вместо
 * читаемой ссылки.
 *
 * Опубликованный slug не меняется: он уже разошёлся по перепискам
 * и проиндексирован. При правке старый адрес обязан отвечать редиректом -
 * см. таблицу product_slug_history.
 */

const MAP: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'c',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
  // казахские буквы: имена работ могут быть на казахском
  ә: 'a',
  ғ: 'g',
  қ: 'k',
  ң: 'n',
  ө: 'o',
  ұ: 'u',
  ү: 'u',
  һ: 'h',
  і: 'i',
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .split('')
    .map((ch) => (ch in MAP ? MAP[ch] : ch))
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * Уникальный slug: если базовый занят, добавляется суффикс.
 * exists проверяется вызывающей стороной - здесь нет доступа к БД.
 */
export async function uniqueSlug(
  title: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(title) || 'rabota';
  if (!(await exists(base))) return base;

  for (let i = 2; i < 100; i++) {
    const candidate = `${base}-${i}`;
    if (!(await exists(candidate))) return candidate;
  }
  return `${base}-${Date.now()}`;
}
