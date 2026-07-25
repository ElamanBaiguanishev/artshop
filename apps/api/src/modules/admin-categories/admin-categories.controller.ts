import {
  type CreateCategoryRequest,
  type ReassignCategoryRequest,
  type UpdateCategoryRequest,
  createCategoryRequest,
  reassignCategoryRequest,
  updateCategoryRequest,
} from '@artshop/shared';
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ZodPipe } from '../../common/zod.pipe';
import { AdminCategoriesService } from './admin-categories.service';

/** CRUD типов товаров. Под авторизацией (глобальный гуард, без @Public). */
@ApiTags('admin/categories')
@ApiBearerAuth()
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(private readonly service: AdminCategoriesService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  create(@Body(new ZodPipe(createCategoryRequest)) dto: CreateCategoryRequest) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodPipe(updateCategoryRequest)) dto: UpdateCategoryRequest,
  ) {
    return this.service.update(id, dto);
  }

  @Post(':id/reassign')
  reassign(
    @Param('id') id: string,
    @Body(new ZodPipe(reassignCategoryRequest)) dto: ReassignCategoryRequest,
  ) {
    return this.service.reassign(id, dto.toCategoryId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { ok: true };
  }
}
