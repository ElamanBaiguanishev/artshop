import {
  type Database,
  orderEvents,
  orderItems,
  orders,
  outboxEvents,
  products,
} from '@artshop/db';
import type { CreateOrderRequest, CreateOrderResponse } from '@artshop/shared';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DB } from '../../db/db.module';
import { makeOrderNumber, makePublicToken } from './order-number';

const RESERVE_HOURS = 48;

@Injectable()
export class OrdersService {
  constructor(@Inject(DB) private readonly db: Database) {}

  /**
   * Создание заявки на покупку.
   *
   * Всё в одной транзакции: заказ, снимок товара, событие в outbox и, для
   * уникальной работы, резерв. Либо всё вместе, либо ничего - заявка не может
   * потеряться из-за того, что уведомление не записалось.
   *
   * Гонка за уникальную работу решается условным UPDATE: перевод в reserved
   * происходит только если товар всё ещё available. Если затронуто ноль строк -
   * кто-то успел раньше, и мы честно об этом говорим.
   */
  async create(dto: CreateOrderRequest): Promise<CreateOrderResponse> {
    return this.db.transaction(async (tx) => {
      const product = dto.productSlug
        ? (await tx.select().from(products).where(eq(products.slug, dto.productSlug)).limit(1)).at(
            0,
          )
        : undefined;

      // порядковый номер заказа: берём из последовательности в БД
      const seqRows = await tx.execute<{ seq: number }>(sql`SELECT nextval('order_seq') AS seq`);
      const seq = seqRows.at(0)?.seq ?? Date.now();
      const number = makeOrderNumber(Number(seq));
      const publicToken = makePublicToken();

      let alreadyReserved = false;

      // резерв только для уникальной доступной работы
      if (product?.isUnique) {
        const reserved = await tx
          .update(products)
          .set({
            status: 'reserved',
            reservedUntil: new Date(Date.now() + RESERVE_HOURS * 3_600_000),
          })
          .where(and(eq(products.id, product.id), eq(products.status, 'available')))
          .returning({ id: products.id });

        // ноль строк = работу успели забронировать между чтением и апдейтом
        alreadyReserved = reserved.length === 0;
      }

      const [order] = await tx
        .insert(orders)
        .values({
          number,
          publicToken,
          type: product ? 'catalog' : 'custom',
          status: 'new',
          customerName: dto.customerName,
          contactChannel: dto.contactChannel,
          contactValue: dto.contactValue,
          customerComment: dto.comment,
          source: dto.source,
        })
        .returning({ id: orders.id });

      if (product && order) {
        await tx
          .update(products)
          .set({ reservedByOrderId: order.id })
          .where(eq(products.id, product.id));

        await tx.insert(orderItems).values({
          orderId: order.id,
          productId: product.id,
          titleSnapshot: product.title,
          priceSnapshot: product.priceAmount,
          currencySnapshot: product.priceCurrency,
        });
      }

      if (order) {
        await tx.insert(orderEvents).values({
          orderId: order.id,
          toStatus: 'new',
          actor: 'customer',
          note: dto.productSlug ? `Заявка на «${product?.title ?? dto.productSlug}»` : 'Заявка',
        });

        // outbox: уведомление уйдёт воркером. dedupKey защищает от дублей.
        await tx.insert(outboxEvents).values({
          topic: 'order.created',
          dedupKey: `order.created:${order.id}`,
          payload: {
            orderId: order.id,
            number,
            customerName: dto.customerName,
            contactChannel: dto.contactChannel,
            contactValue: dto.contactValue,
            comment: dto.comment ?? null,
            productTitle: product?.title ?? null,
            alreadyReserved,
          },
        });
      }

      return {
        orderNumber: number,
        statusUrl: `/order/${publicToken}`,
        alreadyReserved,
      };
    });
  }
}
