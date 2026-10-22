import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { env } from '../config/env.js';

interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: { field: string; message: string }[];
  };
}

function send(res: Response, status: number, body: ErrorBody): void {
  res.status(status).json(body);
}

/** כתובת שלא קיימת בשרת */
export function routeNotFound(req: Request, res: Response): void {
  send(res, 404, { error: { code: 'ROUTE_NOT_FOUND', message: `הכתובת ${req.method} ${req.path} לא קיימת בשרת` } });
}

/** טיפול מרכזי בכל השגיאות: כל שגיאה חוזרת באותו מבנה */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    send(res, err.status, {
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
    return;
  }

  if (err instanceof ZodError) {
    send(res, 400, {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'הנתונים שנשלחו אינם תקינים',
        details: err.issues.map((i) => ({ field: i.path.join('.') || '(root)', message: i.message })),
      },
    });
    return;
  }

  // JSON לא תקין בגוף הבקשה
  if (typeof err === 'object' && err !== null && (err as { type?: string }).type === 'entity.parse.failed') {
    send(res, 400, { error: { code: 'INVALID_JSON', message: 'גוף הבקשה אינו JSON תקין' } });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      send(res, 409, { error: { code: 'ALREADY_EXISTS', message: 'ערך זה כבר קיים במערכת' } });
      return;
    }
    if (err.code === 'P2025') {
      send(res, 404, { error: { code: 'NOT_FOUND', message: 'הרשומה לא נמצאה' } });
      return;
    }
    if (err.code === 'P2034') {
      send(res, 409, { error: { code: 'CONFLICT_RETRY', message: 'הפעולה התנגשה עם פעולה אחרת, נסה שוב' } });
      return;
    }
  }

  if (env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  send(res, 500, { error: { code: 'INTERNAL_ERROR', message: 'אירעה תקלה בשרת, נסה שוב מאוחר יותר' } });
}
