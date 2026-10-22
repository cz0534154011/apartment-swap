import { execSync } from 'node:child_process';
import { loadTestEnv } from './load-test-env.js';

/** רץ פעם אחת לפני כל הבדיקות: בונה את מסד הבדיקות מאפס לפי ה-Migrations */
export default function setup(): void {
  loadTestEnv();
  execSync('npx prisma migrate reset --force --skip-seed --skip-generate', {
    stdio: 'inherit',
    env: process.env,
  });
}
