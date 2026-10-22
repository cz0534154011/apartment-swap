import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { signToken } from '../../middleware/auth.js';
import { conflict, notFound, unauthorized } from '../../utils/errors.js';
import type { LoginInput, RegisterInput, UpdateMeInput } from './auth.schemas.js';

const BCRYPT_ROUNDS = 10;

/** המידע על משתמש שמותר להחזיר ללקוח (בלי Hash) */
export function publicUser(user: User) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw conflict('EMAIL_TAKEN', 'כתובת המייל כבר רשומה באתר');

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      phone: input.phone ?? null,
      passwordHash,
      role: 'USER',
      termsAcceptedAt: new Date(),
    },
  });
  const { token, expiresIn } = signToken(user);
  return { token, expiresIn, user: publicUser(user) };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  // אותה הודעה גם למייל לא קיים וגם לסיסמה שגויה, כדי לא לחשוף אילו מיילים רשומים
  const ok = user ? await bcrypt.compare(input.password, user.passwordHash) : false;
  if (!user || !ok) throw unauthorized('INVALID_CREDENTIALS', 'המייל או הסיסמה שגויים');

  const { token, expiresIn } = signToken(user);
  return { token, expiresIn, user: publicUser(user) };
}

export async function getMe(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { apartment: { select: { id: true } } },
  });
  if (!user) throw notFound('USER_NOT_FOUND', 'המשתמש לא נמצא');
  return { user: publicUser(user), hasApartment: user.apartment !== null };
}

export async function updateMe(userId: number, input: UpdateMeInput) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
    },
  });
  return { user: publicUser(user) };
}
