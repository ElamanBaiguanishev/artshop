import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DbModule } from './db/db.module';
import { HealthController } from './health.controller';
import { JwtAuthGuard } from './modules/auth/auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { RolesGuard } from './modules/auth/roles.decorator';
import { CatalogModule } from './modules/catalog/catalog.module';
import { OrdersModule } from './modules/orders/orders.module';

@Module({
  imports: [
    // .env лежит в корне монорепо: он один на все приложения,
    // чтобы не держать четыре копии одних и тех же переменных
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env'] }),
    // Публичные ручки (каталог, заявка, статус заказа, вход в админку) открыты
    // миру - лимит нужен с первого дня, иначе форму зафлудят боты.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    DbModule,
    AuthModule,
    CatalogModule,
    OrdersModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Закрыто по умолчанию: публичное помечается декоратором @Public().
    // Забытый декоратор означает «недоступно», а не дыру в проде.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
