import type { Request, Response } from 'express';
import { prisma } from '../../db/prisma.js';
import { env } from '../../config/env.js';
import { TERMS_TEXT, TERMS_VERSION } from './terms.js';

/** בדיקת בריאות: השרת עובד והמסד זמין */
export async function health(_req: Request, res: Response) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'ok', time: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', database: 'unreachable', time: new Date().toISOString() });
  }
}

/** פרטי קשר של מנהל האתר ונוסח התקנון */
export function siteInfo(_req: Request, res: Response) {
  res.json({
    adminContactEmail: env.ADMIN_CONTACT_EMAIL,
    termsVersion: TERMS_VERSION,
    termsText: TERMS_TEXT,
  });
}
