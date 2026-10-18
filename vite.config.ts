/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    environmentMatchGlobs: [['src/ui/**', 'jsdom']],
    setupFiles: ['src/ui/test-setup.ts'],
    coverage: {
      include: ['src/core/**'],
      exclude: ['src/core/**/*.test.ts', 'src/core/index.ts', 'src/core/types.ts'],
      thresholds: { lines: 100, branches: 95, functions: 100, statements: 100 },
    },
  },
});
