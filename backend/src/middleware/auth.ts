import type { NextFunction, Request, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { env } from '../config/env.js';
import { prisma } from '../db/prisma.js';
import { forbidden, unauthorized } from '../utils/errors.js';

interface TokenPayload {
  sub?: string;
  role?: Role;
}

export function signToken(user: { id: number; role: Role }): { token: string; expiresIn: number } {
  const token = jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: String(user.id),
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    algorithm: 'HS256',
  });
  const decoded = jwt.decode(token) as { exp: number; iat: number };
  return { token, expiresIn: decoded.exp - decoded.iat };
}

function extractBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, value] = header.split(' ');
  if (scheme !== 'Bearer' || !value) return '';
  return value.trim();
}

/** מאמת Token ומחזיר את המשתמש מהמסד; זורק 401 אם משהו לא תקין */
async function resolveUser(token: string): Promise<{ id: number; role: Role }> {
  let payload: TokenPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as TokenPayload;
  } catch (err) {
    if (err instanceof Error && err.name === 'TokenExpiredError') {
      throw unauthorized('TOKEN_EXPIRED', 'פג תוקף ההתחברות, יש להתחבר מחדש');
    }
    throw unauthorized('INVALID_TOKEN', 'ההתחברות אינה תקינה, יש להתחבר מחדש');
  }

  const id = Number(payload.sub);
  if (!Number.isInteger(id) || id <= 0) {
    throw unauthorized('INVALID_TOKEN', 'ההתחברות אינה תקינה, יש להתחבר מחדש');
  }

  // התפקיד נלקח מהמסד ולא מה-Token, כדי שיהיה תמיד עדכני
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!user) throw unauthorized('INVALID_TOKEN', 'המשתמש לא נמצא, יש להתחבר מחדש');
  return user;
}

/** חובה להיות מחובר */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = extractBearer(req);
  if (token === null) throw unauthorized('AUTH_REQUIRED', 'נדרשת התחברות');
  if (token === '') throw unauthorized('INVALID_TOKEN', 'כותרת ההרשאה צריכה להיות בפורמט Bearer <token>');
  req.user = await resolveUser(token);
  next();
}

/** התחברות לא חובה: אם נשלח Token תקין, המשתמש מזוהה; אחרת ממשיכים כאורח */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = extractBearer(req);
  if (token) {
    try {
      req.user = await resolveUser(token);
    } catch {
      req.user = undefined;
    }
  }
  next();
}

/** מגביל לתפקיד מסוים; יש להשתמש אחרי requireAuth */
export function requireRole(role: Role) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw unauthorized('AUTH_REQUIRED', 'נדרשת התחברות');
    if (req.user.role !== role) {
      throw forbidden(
        'FORBIDDEN',
        role === 'ADMIN' ? 'פעולה זו מותרת למנהל האתר בלבד' : 'פעולה זו מותרת למשתמשים רגילים בלבד',
      );
    }
    next();
  };
}

/** מחזיר את המשתמש המחובר; לשימוש בבקרים שמוגנים ב-requireAuth */
export function currentUser(req: Request): { id: number; role: Role } {
  if (!req.user) throw unauthorized('AUTH_REQUIRED', 'נדרשת התחברות');
  return req.user;
}
