import fs from 'node:fs';
import path from 'node:path';
import { config } from 'dotenv';

/**
 * טוען את .env.test ומוודא שמדובר במסד בדיקות.
 * הבדיקות מוחקות את כל הנתונים במסד, ולכן שם המסד חייב לכלול "test".
 */
export function loadTestEnv(): void {
  const file = path.resolve(process.cwd(), '.env.test');
  if (!fs.existsSync(file)) {
    throw new Error('Missing .env.test file. Copy .env.test.example to .env.test and set a TEST database URL.');
  }
  config({ path: file, override: true });
  process.env.NODE_ENV = 'test';

  const url = process.env.DATABASE_URL ?? '';
  const dbName = url.split('?')[0]?.split('/').pop() ?? '';
  if (!dbName.toLowerCase().includes('test')) {
    throw new Error(
      `Refusing to run tests: the database name "${dbName}" does not contain "test". ` +
        'Tests delete all data, so use a separate test database.',
    );
  }
}
