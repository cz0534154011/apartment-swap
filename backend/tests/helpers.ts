import bcrypt from 'bcryptjs';
import request from 'supertest';
import type { Prisma, Role, SwapStatus } from '@prisma/client';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db/prisma.js';
import { signToken } from '../src/middleware/auth.js';
import { addDays, todayYmd, ymdToDate } from '../src/utils/dates.js';

export { prisma };

const app = createApp();
export const api = () => request(app);

export async function resetDb(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "SwapOffer", "BlockedDate", "Apartment", "City", "User" RESTART IDENTITY CASCADE',
  );
}

/** תאריך בעוד n ימים מהיום, בפורמט YYYY-MM-DD */
export const day = (n: number): string => addDays(todayYmd(), n);

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

let counter = 0;

export async function createUser(
  opts: { email?: string; fullName?: string; phone?: string | null; role?: Role; password?: string } = {},
) {
  counter += 1;
  const password = opts.password ?? 'Passw0rd!';
  const user = await prisma.user.create({
    data: {
      fullName: opts.fullName ?? `משתמש ${counter}`,
      email: opts.email ?? `user${counter}@test.com`,
      phone: opts.phone === undefined ? `05000000${String(counter).padStart(2, '0')}` : opts.phone,
      passwordHash: await bcrypt.hash(password, 4),
      role: opts.role ?? 'USER',
      termsAcceptedAt: new Date(),
    },
  });
  return { user, token: signToken(user).token, password };
}

export async function createAdmin() {
  return createUser({ role: 'ADMIN', fullName: 'מנהל', email: `admin${counter + 1}@test.com` });
}

export async function createCity(name = 'ירושלים', isActive = true) {
  return prisma.city.create({ data: { name, isActive } });
}

export async function createApartment(
  ownerId: number,
  cityId: number,
  overrides: Partial<Prisma.ApartmentUncheckedCreateInput> = {},
) {
  return prisma.apartment.create({
    data: {
      ownerId,
      cityId,
      title: 'דירה לדוגמה לבדיקות',
      neighborhood: 'שכונה',
      rooms: 4,
      beds: 6,
      floor: 1,
      description: 'תיאור ארוך מספיק לבדיקה',
      ...overrides,
    },
  });
}

/** משתמש רגיל עם דירה פעילה */
export async function userWithApartment(
  cityId: number,
  overrides: Partial<Prisma.ApartmentUncheckedCreateInput> = {},
  userOpts: Parameters<typeof createUser>[0] = {},
) {
  const { user, token, password } = await createUser(userOpts);
  const apartment = await createApartment(user.id, cityId, overrides);
  return { user, token, password, apartment };
}

/** יצירת הצעה ישירות במסד (לבדיקות שצריכות מצב מוכן מראש, כולל תאריכים בעבר) */
export async function insertSwap(data: {
  senderApartmentId: number;
  receiverApartmentId: number;
  start: string;
  end: string;
  status?: SwapStatus;
  cancelRequestedById?: number | null;
}) {
  return prisma.swapOffer.create({
    data: {
      senderApartmentId: data.senderApartmentId,
      receiverApartmentId: data.receiverApartmentId,
      startDate: ymdToDate(data.start),
      endDate: ymdToDate(data.end),
      status: data.status ?? 'PENDING',
      cancelRequestedById: data.cancelRequestedById ?? null,
      cancelRequestedAt: data.cancelRequestedById ? new Date() : null,
    },
  });
}

export function validApartmentBody(cityId: number) {
  return {
    title: 'דירת 4 חדרים ליד בית הכנסת',
    cityId,
    neighborhood: 'רמות',
    rooms: 4.5,
    beds: 8,
    floor: 2,
    hasElevator: true,
    hasPlata: true,
    hasUrn: false,
    hasShabbatClock: true,
    hasEruv: true,
    hasGenerator: false,
    description: 'דירה מרווחת ומוארת, קרובה לבית הכנסת ולגן משחקים.',
  };
}
