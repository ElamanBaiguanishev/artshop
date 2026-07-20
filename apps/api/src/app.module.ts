import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DbModule } from './db/db.module';
import { HealthController } from './health.controller';
import { CatalogModule } from './modules/catalog/catalog.module';

@Module({
  imports: [
    // .env лежит в корне монорепо: он один на все приложения,
    // чтобы не держать четыре копии одних и тех же переменных
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env'] }),
    // Публичные ручки (каталог, заявка, статус заказа, вход в админку) открыты
    // миру - лимит нужен с первого дня, иначе форму зафлудят боты.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    DbModule,
    CatalogModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
