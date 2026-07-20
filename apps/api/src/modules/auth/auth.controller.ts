import { type LoginRequest, type LoginResponse, loginRequest } from '@artshop/shared';
import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { ZodPipe } from '../../common/zod.pipe';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /**
   * Единственная публично торчащая дверь в систему,
   * поэтому лимит здесь жёстче общего: 5 попыток в минуту.
   */
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('login')
  login(@Body(new ZodPipe(loginRequest)) dto: LoginRequest): Promise<LoginResponse> {
    return this.auth.login(dto);
  }

  @Get('me')
  me(@Req() req: Request) {
    return req.admin;
  }
}
