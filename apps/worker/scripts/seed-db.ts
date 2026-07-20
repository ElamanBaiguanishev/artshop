/**
 * Наполняет каталог работами, ссылаясь на изображения, залитые seed-images.
 * Только для локальной разработки.
 *   pnpm --filter @artshop/worker seed:db
 */
import { createDb, productImages, products } from '@artshop/db';

const PUBLIC = process.env.S3_PUBLIC_URL ?? 'http://localhost:9000/artshop-media';

/** Размеры совпадают с тем, что сгенерировал seed-images. */
const DIMS: Record<string, [number, number]> = {
  zakat: [1200, 1600],
  'zakat-room': [1600, 1200],
  tuman: [1200, 1600],
  'tuman-room': [1600, 1200],
  step: [1600, 1200],
  mak: [1200, 1600],
  gory: [1600, 1200],
  'brelok-kot': [1200, 1200],
  'brelok-cvet': [1200, 1200],
  podstavka: [1200, 1200],
};

const HASHES: Record<string, string> = {
  zakat: 'USI{vPxFfQxF}=oLfQoLs.jtfQjtxZj@fQj@',
  'zakat-room': 'UKC%+tt6fQt6_KkBfQkBtQj@fQj@xtj[fQj[',
  tuman: 'UKC%+tt6fQt6_KkBfQkBtQj@fQj@xtj[fQj[',
  'tuman-room': 'UXKv?7t6fQt6~UoLfQoLt7j@fQj@xtj@fQj@',
  step: 'USI{vPxFfQxF}=oLfQoLs.jtfQjtxZj@fQj@',
  mak: 'USI{vPxFfQxF}=oLfQoLs.jtfQjtxZj@fQj@',
  gory: 'UKC%+tt6fQt6_KkBfQkBtQj@fQj@xtj[fQj[',
  'brelok-kot': 'UXKv?7t6fQt6~UoLfQoLt7j@fQj@xtj@fQj@',
  'brelok-cvet': 'UXKv?7t6fQt6~UoLfQoLt7j@fQj@xtj@fQj@',
  podstavka: 'UXKv?7t6fQt6~UoLfQoLt7j@fQj@xtj@fQj@',
};

function variantsOf(key: string) {
  const [w, h] = DIMS[key] ?? [1200, 1600];
  const scale = (target: number) => {
    const width = Math.min(target, w);
    return { width, height: Math.round((h / w) * width) };
  };
  const mk = (name: string, target: number) => {
    const { width, height } = scale(target);
    return { key: `v/${key}-${name}.webp`, url: `${PUBLIC}/v/${key}-${name}.webp`, width, height };
  };
  return { thumb: mk('thumb', 400), card: mk('card', 900), full: mk('full', 1800) };
}

interface Seed {
  slug: string;
  title: string;
  description: string;
  kind: 'painting' | 'keychain' | 'decor';
  status: 'available' | 'sold';
  price: number | null;
  size: [number, number];
  weight: number;
  materials: string[];
  year: number;
  images: { key: string; interior?: boolean }[];
  daysAgo: number;
}

const WORKS: Seed[] = [
  {
    slug: 'zakat-nad-stepyu',
    title: 'Закат над степью',
    description:
      'Тёплый августовский вечер под Петропавловском. Писала с натуры три сеанса подряд — свет держится всего сорок минут, потом степь становится совсем другой.',
    kind: 'painting',
    status: 'available',
    price: 4500000,
    size: [600, 800],
    weight: 1800,
    materials: ['холст', 'масло'],
    year: 2026,
    images: [{ key: 'zakat' }, { key: 'zakat-room', interior: true }],
    daysAgo: 1,
  },
  {
    slug: 'utrenniy-tuman',
    title: 'Утренний туман',
    description:
      'Раннее утро у реки Ишим. Туман поднимается от воды и держится до восьми, потом исчезает за десять минут.',
    kind: 'painting',
    status: 'sold',
    price: 3800000,
    size: [800, 600],
    weight: 2100,
    materials: ['холст', 'масло'],
    year: 2025,
    images: [{ key: 'tuman' }, { key: 'tuman-room', interior: true }],
    daysAgo: 40,
  },
  {
    slug: 'polden-v-stepi',
    title: 'Полдень в степи',
    description: 'Выгоревшая трава и раскалённый воздух. Самое сложное — передать дрожание света.',
    kind: 'painting',
    status: 'available',
    price: 5200000,
    size: [900, 700],
    weight: 2400,
    materials: ['холст', 'масло'],
    year: 2026,
    images: [{ key: 'step' }],
    daysAgo: 6,
  },
  {
    slug: 'makovoe-pole',
    title: 'Маковое поле',
    description: 'Писала за один сеанс, пока маки не закрылись. Красный на закате звучит иначе.',
    kind: 'painting',
    status: 'available',
    price: 4100000,
    size: [500, 700],
    weight: 1500,
    materials: ['холст', 'масло'],
    year: 2026,
    images: [{ key: 'mak' }],
    daysAgo: 12,
  },
  {
    slug: 'gory-na-rassvete',
    title: 'Горы на рассвете',
    description: 'По этюдам из поездки в Алматы. Холодный воздух и первый свет на склонах.',
    kind: 'painting',
    status: 'sold',
    price: 6400000,
    size: [1000, 700],
    weight: 3000,
    materials: ['холст', 'масло'],
    year: 2025,
    images: [{ key: 'gory' }],
    daysAgo: 70,
  },
  {
    slug: 'brelok-kot',
    title: 'Брелок «Кот»',
    description: 'Эпоксидная смола с сухоцветами. Имя и цвет — на выбор, делается за три дня.',
    kind: 'keychain',
    status: 'available',
    price: 600000,
    size: [45, 70],
    weight: 40,
    materials: ['эпоксидная смола', 'сухоцветы'],
    year: 2026,
    images: [{ key: 'brelok-kot' }],
    daysAgo: 3,
  },
  {
    slug: 'brelok-cvety',
    title: 'Брелок с полевыми цветами',
    description: 'Собраны в июне под городом, засушены и залиты смолой. Каждый набор неповторим.',
    kind: 'keychain',
    status: 'available',
    price: 700000,
    size: [45, 75],
    weight: 45,
    materials: ['эпоксидная смола', 'полевые цветы'],
    year: 2026,
    images: [{ key: 'brelok-cvet' }],
    daysAgo: 8,
  },
  {
    slug: 'podstavka-pod-chashku',
    title: 'Подставка под чашку',
    description: 'Смола и срез карагача. Держит горячее, не боится воды.',
    kind: 'decor',
    status: 'available',
    price: 900000,
    size: [110, 110],
    weight: 180,
    materials: ['эпоксидная смола', 'карагач'],
    year: 2026,
    images: [{ key: 'podstavka' }],
    daysAgo: 20,
  },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const db = createDb(url);

  await db.delete(productImages);
  await db.delete(products);

  for (const w of WORKS) {
    const published = new Date(Date.now() - w.daysAgo * 86_400_000);
    const [created] = await db
      .insert(products)
      .values({
        slug: w.slug,
        title: w.title,
        description: w.description,
        kind: w.kind,
        status: w.status,
        priceAmount: w.price === null ? null : BigInt(w.price),
        priceCurrency: 'KZT',
        widthMm: w.size[0],
        heightMm: w.size[1],
        weightG: w.weight,
        materials: w.materials,
        year: w.year,
        customsCategory: w.kind === 'painting' ? 'original_art' : 'souvenir',
        publishedAt: published,
        soldAt: w.status === 'sold' ? published : null,
      })
      .returning({ id: products.id });

    if (!created) continue;

    await db.insert(productImages).values(
      w.images.map((img, i) => ({
        productId: created.id,
        position: i,
        originalKey: `orig/${img.key}.jpg`,
        variants: variantsOf(img.key),
        blurhash: HASHES[img.key] ?? null,
        alt: `${w.title}${img.interior ? ' в интерьере' : ''}`,
        processingStatus: 'ready' as const,
        isInteriorShot: Boolean(img.interior),
      })),
    );

    console.log(`${w.slug}: ${w.images.length} фото`);
  }

  console.log(`\nготово: ${WORKS.length} работ`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
