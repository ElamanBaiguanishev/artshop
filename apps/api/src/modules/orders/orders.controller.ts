import { type CreateOrderRequest, createOrderRequest } from '@artshop/shared';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ZodPipe } from '../../common/zod.pipe';
import { Public } from '../auth/public.decorator';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  /**
   * Публичная заявка с сайта. Форма открыта миру, поэтому лимит жёстче общего:
   * 10 заявок в минуту с адреса - живой человек столько не оставит, а бот отсечётся.
   */
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post()
  create(@Body(new ZodPipe(createOrderRequest)) dto: CreateOrderRequest) {
    return this.orders.create(dto);
  }
}
