import { type Database, createDb } from '@artshop/db';
import { Global, Module } from '@nestjs/common';

export const DB = Symbol('DB');

/**
 * Единственное подключение к БД на всё приложение.
 * Global - чтобы не импортировать модуль в каждый feature-модуль.
 */
@Global()
@Module({
  providers: [
    {
      provide: DB,
      useFactory: (): Database => {
        const url = process.env.DATABASE_URL;
        if (!url) throw new Error('DATABASE_URL is required');
        return createDb(url);
      },
    },
  ],
  exports: [DB],
})
export class DbModule {}
