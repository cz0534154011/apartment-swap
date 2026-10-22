import { Prisma, type PrismaClient } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { todayYmd, ymdToDate } from '../../utils/dates.js';

/** אפשר להעביר את החיבור הרגיל או חיבור בתוך טרנזקציה */
export type Db = PrismaClient | Prisma.TransactionClient;

/**
 * נעילת שורות הדירות עד סוף הטרנזקציה.
 * כך שתי פעולות שנוגעות באותה דירה (למשל שני אישורים סותרים) לא רצות במקביל.
 * הנעילה תמיד לפי סדר מזהים עולה, כדי למנוע מצב של המתנה הדדית.
 */
export async function lockApartments(tx: Prisma.TransactionClient, ids: number[]): Promise<void> {
  const sorted = [...new Set(ids)].sort((a, b) => a - b);
  if (sorted.length === 0) return;
  await tx.$queryRaw`SELECT id FROM "Apartment" WHERE id IN (${Prisma.join(sorted)}) ORDER BY id FOR UPDATE`;
}

/** תנאי חפיפה: לטווח יש לפחות יום משותף אחד עם [start, end] */
function overlaps(start: Date, end: Date) {
  return { startDate: { lte: end }, endDate: { gte: start } };
}

/**
 * האם הדירה תפוסה בטווח: יש החלפה מאושרת או חסימה ידנית שחופפות.
 * excludeSwapId מאפשר להתעלם מהחלפה מסוימת (למשל זו שעכשיו מאשרים).
 */
export async function isApartmentBusy(
  db: Db,
  apartmentId: number,
  start: Date,
  end: Date,
  excludeSwapId?: number,
): Promise<boolean> {
  const swap = await db.swapOffer.findFirst({
    where: {
      status: 'APPROVED',
      ...(excludeSwapId !== undefined ? { id: { not: excludeSwapId } } : {}),
      OR: [{ senderApartmentId: apartmentId }, { receiverApartmentId: apartmentId }],
      ...overlaps(start, end),
    },
    select: { id: true },
  });
  if (swap) return true;

  const block = await db.blockedDate.findFirst({
    where: { apartmentId, ...overlaps(start, end) },
    select: { id: true },
  });
  return block !== null;
}

/**
 * דחייה אוטומטית של הצעות ממתינות שמעורבת בהן אחת הדירות ושחופפות לטווח.
 * מחזירה כמה הצעות נדחו.
 */
export async function autoRejectOverlapping(
  db: Db,
  apartmentIds: number[],
  start: Date,
  end: Date,
  exceptSwapId?: number,
): Promise<number> {
  const result = await db.swapOffer.updateMany({
    where: {
      status: 'PENDING',
      ...(exceptSwapId !== undefined ? { id: { not: exceptSwapId } } : {}),
      OR: [{ senderApartmentId: { in: apartmentIds } }, { receiverApartmentId: { in: apartmentIds } }],
      ...overlaps(start, end),
    },
    data: { status: 'AUTO_REJECTED', respondedAt: new Date() },
  });
  return result.count;
}

/** דחייה אוטומטית של כל ההצעות הממתינות של דירה (בחסימה על ידי מנהל) */
export async function autoRejectAllPending(db: Db, apartmentId: number): Promise<number> {
  const result = await db.swapOffer.updateMany({
    where: {
      status: 'PENDING',
      OR: [{ senderApartmentId: apartmentId }, { receiverApartmentId: apartmentId }],
    },
    data: { status: 'AUTO_REJECTED', respondedAt: new Date() },
  });
  return result.count;
}

/**
 * עדכון מצבים שתלויים בזמן. נקרא לפני כל קריאה או פעולה על הצעות:
 * - הצעה ממתינה שתאריך ההתחלה שלה עבר: "פג תוקף".
 * - בקשת ביטול שלא נענתה עד תאריך ההתחלה: פוקעת, וההחלפה נשארת בתוקף.
 */
export async function expireStale(db: Db = prisma): Promise<void> {
  const today = ymdToDate(todayYmd());
  await db.swapOffer.updateMany({
    where: { status: 'PENDING', startDate: { lt: today } },
    data: { status: 'EXPIRED' },
  });
  await db.swapOffer.updateMany({
    where: { status: 'APPROVED', cancelRequestedById: { not: null }, startDate: { lte: today } },
    data: { cancelRequestedById: null, cancelRequestReason: null, cancelRequestedAt: null },
  });
}
