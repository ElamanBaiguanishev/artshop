import {
  type CompleteUploadRequest,
  type UploadUrlRequest,
  completeUploadRequest,
  uploadUrlRequest,
} from '@artshop/shared';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ZodPipe } from '../../common/zod.pipe';
import { MediaService } from './media.service';

/** Загрузка фото — только для авторизованных (гуард глобальный, @Public не стоит). */
@ApiTags('media')
@ApiBearerAuth()
@Controller('admin/media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('upload-url')
  requestUpload(@Body(new ZodPipe(uploadUrlRequest)) dto: UploadUrlRequest) {
    return this.media.requestUpload(dto);
  }

  @Post('complete')
  async complete(@Body(new ZodPipe(completeUploadRequest)) dto: CompleteUploadRequest) {
    await this.media.completeUpload(dto.imageId);
    return { ok: true };
  }
}
