import {
  type CreateProductRequest,
  type UpdateProductRequest,
  createProductRequest,
  updateProductRequest,
} from '@artshop/shared';
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ZodPipe } from '../../common/zod.pipe';
import { AdminProductsService } from './admin-products.service';

/** CRUD работ. Всё под авторизацией (глобальный гуард, без @Public). */
@ApiTags('admin/products')
@ApiBearerAuth()
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly service: AdminProductsService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  create(@Body(new ZodPipe(createProductRequest)) dto: CreateProductRequest) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodPipe(updateProductRequest)) dto: UpdateProductRequest,
  ) {
    return this.service.update(id, dto);
  }

  @Delete('images/:imageId')
  async deleteImage(@Param('imageId') imageId: string) {
    await this.service.deleteImage(imageId);
    return { ok: true };
  }
}
