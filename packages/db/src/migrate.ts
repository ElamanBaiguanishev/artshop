import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const url = process.env.DATABASE_URL ?? 'postgres://artshop:artshop@localhost:5433/artshop';

async function main() {
  // max: 1 - миграции выполняются последовательно на одном соединении
  const client = postgres(url, { max: 1 });
  await migrate(drizzle(client), { migrationsFolder: './drizzle' });
  await client.end();
  console.log('migrations applied');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
