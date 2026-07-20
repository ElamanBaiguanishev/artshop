/**
 * Заведение администратора.
 *
 * Регистрации в системе нет и не будет: пользователей двое, и открытая
 * форма регистрации у админки - лишняя дверь. Аккаунты создаются этим скриптом.
 *
 *   pnpm --filter @artshop/api admin:create alia@example.com "пароль" owner "Алия"
 */
import { adminUsers, createDb } from '@artshop/db';
import * as argon2 from 'argon2';
import { eq } from 'drizzle-orm';

const [email, password, role = 'owner', name] = process.argv.slice(2);

if (!email || !password) {
  console.error('Использование: admin:create <email> <пароль> [owner|manager] [имя]');
  process.exit(1);
}

if (password.length < 8) {
  console.error('Пароль короче 8 символов');
  process.exit(1);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');

  const db = createDb(url);
  const normalized = email!.toLowerCase();

  const [existing] = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, normalized))
    .limit(1);

  const passwordHash = await argon2.hash(password!);

  if (existing) {
    await db.update(adminUsers).set({ passwordHash }).where(eq(adminUsers.id, existing.id));
    console.log(`Пароль обновлён: ${normalized}`);
  } else {
    const [created] = await db
      .insert(adminUsers)
      .values({
        email: normalized,
        passwordHash,
        role: role as 'owner' | 'manager',
        name: name ?? null,
      })
      .returning({ id: adminUsers.id });
    console.log(`Создан администратор ${normalized} (${role}), id ${created?.id}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
