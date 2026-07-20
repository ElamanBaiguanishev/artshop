import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

export const ROLES = 'roles';

/**
 * Ограничение по роли. Модель заложена с первого дня:
 * прикрутить её к готовому приложению дорого, держать в схеме - почти бесплатно.
 * Интерфейс управления ролями появляется на этапе 5.
 */
export const Roles = (...roles: Array<'owner' | 'manager'>) => SetMetadata(ROLES, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const req = context.switchToHttp().getRequest<Request>();
    if (!req.admin || !required.includes(req.admin.role)) {
      throw new ForbiddenException('Недостаточно прав');
    }
    return true;
  }
}
