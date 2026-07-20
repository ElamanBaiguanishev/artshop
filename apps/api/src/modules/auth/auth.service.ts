import { type Database, adminUsers } from '@artshop/db';
import type { LoginRequest, LoginResponse } from '@artshop/shared';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { DB } from '../../db/db.module';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginRequest): Promise<LoginResponse> {
    const [user] = await this.db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, dto.email.toLowerCase()))
      .limit(1);

    // Одинаковый ответ на «нет пользователя» и «неверный пароль»:
    // иначе форма входа превращается в способ узнать, какие адреса заведены.
    const invalid = new UnauthorizedException('Неверная почта или пароль');
    if (!user || !user.isActive) throw invalid;

    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) throw invalid;

    await this.db
      .update(adminUsers)
      .set({ lastLoginAt: new Date() })
      .where(eq(adminUsers.id, user.id));

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  /** Заведение администратора. Используется скриптом первичной настройки. */
  async createAdmin(email: string, password: string, role: 'owner' | 'manager', name?: string) {
    const passwordHash = await argon2.hash(password);
    const [created] = await this.db
      .insert(adminUsers)
      .values({ email: email.toLowerCase(), passwordHash, role, name })
      .returning({ id: adminUsers.id, email: adminUsers.email });
    return created;
  }
}
