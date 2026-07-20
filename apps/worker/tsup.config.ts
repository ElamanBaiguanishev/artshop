import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/main.ts'],
  format: ['esm'],
  clean: true,
  sourcemap: true,
  target: 'node22',
  // sharp тянет нативные бинарники - оставляем во внешних
  external: ['sharp'],
});
