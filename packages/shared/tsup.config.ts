import { defineConfig } from 'tsup';

// Сборка в оба формата: api живёт в CommonJS (Nest, декораторы),
// web/worker/chat-gateway - в ESM. Один пакет обслуживает и тех, и других.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
});
