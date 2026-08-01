import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.test.js'],
    // Run each test file in an isolated worker so the CJS server module
    // can be imported properly via Vitest's transform pipeline
    pool: 'forks',
  },
});
