import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { IS_PUBLIC } from './public.decorator';

export interface AdminPrincipal {
  sub: string;
  email: string;
  role: 'owner' | 'manager';
}

declare module 'express' {
  interface Request {
    admin?: AdminPrincipal;
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Требуется авторизация');
    }

    try {
      req.admin = await this.jwt.verifyAsync<AdminPrincipal>(header.slice(7));
      return true;
    } catch {
      throw new UnauthorizedException('Недействительный токен');
    }
  }
}
