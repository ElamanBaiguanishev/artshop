import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/schema.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  // drizzle-orm подтягивается потребителем, не вшиваем в бандл
  external: ['drizzle-orm', 'postgres'],
});
