import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Tests use `.mjs` so they run as ES modules even though the rest of the
    // backend is CommonJS — Vitest 4 requires ESM at the test-file level.
    include: ['src/**/*.{test,spec}.mjs'],
  },
});
