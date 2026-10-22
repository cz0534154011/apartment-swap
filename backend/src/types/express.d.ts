import 'express-serve-static-core';
import type { Role } from '@prisma/client';

declare module 'express-serve-static-core' {
  interface Request {
    /** המשתמש המחובר, נקבע לפי ה-Token בלבד */
    user?: {
      id: number;
      role: Role;
    };
  }
}
