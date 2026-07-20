import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.WEB_ORIGIN?.split(',') ?? true,
    credentials: true,
  });

  // Глобального ValidationPipe нет намеренно: он тянет class-validator,
  // а мы валидируем zod-схемами из @artshop/shared - теми же, что использует
  // фронт. Контракт описан один раз (см. common/zod.pipe.ts).

  const config = new DocumentBuilder()
    .setTitle('Artshop API')
    .setDescription('Каталог, заказы, админка')
    .setVersion('0.0.1')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  const port = Number(process.env.API_PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
  console.log(`api listening on ${port}`);
}

void bootstrap();
