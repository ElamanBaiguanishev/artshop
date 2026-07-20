import type { HealthResponse } from '@artshop/shared';
import { Controller, Get } from '@nestjs/common';
import { Public } from './modules/auth/public.decorator';

@Controller()
export class HealthController {
  @Public()
  @Get('health')
  health(): HealthResponse {
    return {
      service: 'api',
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      version: process.env.npm_package_version ?? '0.0.1',
    };
  }
}
