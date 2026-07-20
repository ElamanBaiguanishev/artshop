import type { PublicProductCard, PublicProductDetail } from '@artshop/shared';

type PublicImage = PublicProductDetail['images'][number];

type ProductRow = {
  slug: string;
  title: string;
  kind: string;
  status: string;
  priceAmount: bigint | null;
  priceCurrency: string;
  priceOnRequest: boolean;
  description: string | null;
  widthMm: number | null;
  heightMm: number | null;
  depthMm: number | null;
  materials: string[] | null;
  year: number | null;
};

type ImageRow = {
  variants: unknown;
  blurhash: string | null;
  alt: string | null;
  isInteriorShot: boolean;
  position: number;
};

/**
 * Внутренний статус -> публичный. Наружу не выходят ни draft, ни archived,
 * а reserved показывается как available: посетителю незачем знать,
 * что кто-то уже оставил заявку, пока сделка не состоялась.
 */
function toPublicStatus(status: string): PublicProductCard['status'] {
  switch (status) {
    case 'sold':
      return 'sold';
    case 'available':
    case 'reserved':
      return 'available';
    default:
      return 'on_order';
  }
}

function toPublicImage(row: ImageRow): PublicImage | null {
  // изображение ещё обрабатывается воркером - вариантов пока нет
  if (!row.variants) return null;
  return {
    variants: row.variants as PublicImage['variants'],
    blurhash: row.blurhash,
    alt: row.alt,
    isInteriorShot: row.isInteriorShot,
  };
}

function toPrice(row: ProductRow): PublicProductCard['price'] {
  if (row.priceOnRequest || row.priceAmount === null) return null;
  // bigint отдаётся строкой: JSON не умеет bigint, а number теряет точность
  return { amount: row.priceAmount.toString(), currency: row.priceCurrency };
}

export function toCard(row: ProductRow, images: ImageRow[]): PublicProductCard {
  const first = images[0];
  const cover = first ? toPublicImage(first) : null;
  return {
    slug: row.slug,
    title: row.title,
    kind: row.kind as PublicProductCard['kind'],
    status: toPublicStatus(row.status),
    price: toPrice(row),
    priceOnRequest: row.priceOnRequest,
    cover,
  };
}

export function toDetail(row: ProductRow, images: ImageRow[]): PublicProductDetail {
  const ready = images
    .sort((a, b) => a.position - b.position)
    .map(toPublicImage)
    .filter((i): i is PublicImage => i !== null);

  return {
    ...toCard(row, images),
    description: row.description,
    images: ready,
    dimensions:
      row.widthMm || row.heightMm || row.depthMm
        ? { widthMm: row.widthMm, heightMm: row.heightMm, depthMm: row.depthMm }
        : null,
    materials: row.materials,
    year: row.year,
  };
}
