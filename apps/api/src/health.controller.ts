import { Controller, Get } from '@nestjs/common';
import type { HealthResponse } from '@artshop/shared';

@Controller()
export class HealthController {
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
