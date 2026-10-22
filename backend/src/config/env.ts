import { z } from 'zod';

/**
 * קריאה ובדיקה של משתני הסביבה.
 * אם חסר משתנה חובה, השרת לא יעלה ויודפס הסבר ברור מה חסר.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]?$/, 'JWT_EXPIRES_IN must look like 24h, 7d, 3600')
    .default('24h'),
  // רשימת כתובות מותרות מופרדות בפסיק, או * כדי לאפשר הכל
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  ADMIN_CONTACT_EMAIL: z.string().email('ADMIN_CONTACT_EMAIL must be a valid email').default('admin@example.com'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    // eslint-disable-next-line no-console
    console.error(`\nInvalid environment variables:\n${problems}\n\nSee .env.example for the full list.\n`);
    throw new Error('Invalid environment variables');
  }
  return parsed.data;
}

export const env = loadEnv();

export function corsOrigins(): string[] | '*' {
  const raw = env.CORS_ORIGIN.trim();
  if (raw === '*') return '*';
  return raw
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
}
