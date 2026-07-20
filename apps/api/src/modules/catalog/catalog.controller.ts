import {
  type CatalogQuery,
  type CatalogResponse,
  type PublicProductDetail,
  catalogQuery,
} from '@artshop/shared';
import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ZodPipe } from '../../common/zod.pipe';
import { Public } from '../auth/public.decorator';
// НЕ import type: Nest внедряет сервис по значению в рантайме,
// а import type стирается при компиляции и ломает DI.
import { CatalogService } from './catalog.service';

/**
 * Публичная часть: авторизации нет, но действует общий rate limit
 * (ThrottlerGuard в AppModule) - ручки открыты миру.
 */
@Public()
@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @ApiOkResponse({ description: 'Список работ с курсорной подгрузкой' })
  list(@Query(new ZodPipe(catalogQuery)) query: CatalogQuery): Promise<CatalogResponse> {
    return this.catalog.list(query);
  }

  @Get('sitemap')
  @ApiOkResponse({ description: 'Slug и даты обновления для sitemap.xml' })
  slugs() {
    return this.catalog.listSlugs();
  }

  @Get(':slug')
  @ApiOkResponse({ description: 'Карточка работы; 301 если slug устарел' })
  async bySlug(
    @Param('slug') slug: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PublicProductDetail | undefined> {
    const result = await this.catalog.getBySlug(slug);

    if ('redirectTo' in result) {
      // 301, а не 302: адрес сменился навсегда, вес старого передаётся новому
      res.redirect(301, `/catalog/${result.redirectTo}`);
      return undefined;
    }

    return result.product;
  }
}
