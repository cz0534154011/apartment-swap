import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['tests/global-setup.ts'],
    setupFiles: ['tests/setup-env.ts'],
    // כל הבדיקות משתמשות באותו מסד נתונים לבדיקות, ולכן רצות אחת אחרי השנייה
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 120000,
  },
});
