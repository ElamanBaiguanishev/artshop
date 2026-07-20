import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret || secret === 'change-me-in-production') {
          // падаем на старте, а не при первом входе в админку
          throw new Error('JWT_SECRET is required and must not be the default value');
        }
        // expiresIn типизирован литеральным шаблоном ('7d', '30m'...),
        // а из окружения приходит обычная строка - приводим явно
        const expiresIn = (process.env.JWT_EXPIRES_IN ?? '7d') as `${number}${'d' | 'h' | 'm'}`;
        return { secret, signOptions: { expiresIn } };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
