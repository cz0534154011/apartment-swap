import type { Prisma, Role } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import {
  assertValidRange,
  dateToYmd,
  MAX_RANGE_DAYS,
  maxAllowedYmd,
  todayYmd,
  ymdToDate,
} from '../../utils/dates.js';
import { conflict, forbidden, notFound, validationError } from '../../utils/errors.js';
import { paginate, skipTake } from '../../utils/pagination.js';
import { autoRejectOverlapping, expireStale, isApartmentBusy, lockApartments } from '../swaps/availability.js';
import { AMENITY_KEYS, type ApartmentInput, type BlockedDateInput, type SearchQuery } from './apartments.schemas.js';
import { apartmentOwnerView, apartmentPublic } from './apartments.serializer.js';

type Viewer = { id: number; role: Role } | undefined;

// ---------------------------------------------------------------- חיפוש

export async function searchApartments(query: SearchQuery, viewer: Viewer) {
  if ((query.from && !query.to) || (!query.from && query.to)) {
    throw validationError([
      { field: query.from ? 'to' : 'from', message: 'לסינון לפי תאריכים יש לשלוח גם from וגם to' },
    ]);
  }
  if (query.from && query.to) {
    assertValidRange(query.from, query.to, { startField: 'from', endField: 'to', maxDays: MAX_RANGE_DAYS });
  }

  const and: Prisma.ApartmentWhereInput[] = [{ status: 'ACTIVE' }, { isBlocked: false }];

  // הדירה של המשתמש המחובר לא מופיעה בתוצאות שלו
  if (viewer) and.push({ ownerId: { not: viewer.id } });
  if (query.cityId) and.push({ cityId: query.cityId });
  if (query.minBeds) and.push({ beds: { gte: query.minBeds } });
  if (query.minRooms) and.push({ rooms: { gte: query.minRooms } });
  for (const key of AMENITY_KEYS) {
    if (query[key] === true) {
      const condition: Prisma.ApartmentWhereInput = {};
      condition[key] = true;
      and.push(condition);
    }
  }
  if (query.q) {
    and.push({
      OR: [
        { title: { contains: query.q, mode: 'insensitive' } },
        { neighborhood: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ],
    });
  }
  if (query.from && query.to) {
    // רק דירות פנויות בכל הטווח: אין חסימה ואין החלפה מאושרת שחופפות
    const range = { startDate: { lte: ymdToDate(query.to) }, endDate: { gte: ymdToDate(query.from) } };
    and.push(
      { blockedDates: { none: range } },
      { sentOffers: { none: { status: 'APPROVED', ...range } } },
      { receivedOffers: { none: { status: 'APPROVED', ...range } } },
    );
  }

  const where: Prisma.ApartmentWhereInput = { AND: and };
  const orderBy: Prisma.ApartmentOrderByWithRelationInput[] =
    query.sort === 'beds'
      ? [{ beds: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }]
      : [{ createdAt: 'desc' }, { id: 'desc' }];

  const [items, total] = await prisma.$transaction([
    prisma.apartment.findMany({
      where,
      include: { city: true },
      orderBy,
      ...skipTake(query.page, query.pageSize),
    }),
    prisma.apartment.count({ where }),
  ]);

  return paginate(items.map(apartmentPublic), total, query.page, query.pageSize);
}

// ---------------------------------------------------------------- צפייה בדירה

/** דירה מוסתרת או חסומה גלויה רק לבעליה ולמנהל; לכל השאר היא "לא נמצאה" */
async function getVisibleApartment(id: number, viewer: Viewer) {
  const apartment = await prisma.apartment.findUnique({ where: { id }, include: { city: true } });
  if (!apartment) throw notFound('APARTMENT_NOT_FOUND', 'הדירה לא נמצאה');
  const isOwner = viewer?.id === apartment.ownerId;
  const isAdmin = viewer?.role === 'ADMIN';
  const isPubliclyVisible = apartment.status === 'ACTIVE' && !apartment.isBlocked;
  if (!isPubliclyVisible && !isOwner && !isAdmin) {
    throw notFound('APARTMENT_NOT_FOUND', 'הדירה לא נמצאה');
  }
  return { apartment, isOwner, isAdmin };
}

export async function getApartment(id: number, viewer: Viewer) {
  const { apartment, isOwner, isAdmin } = await getVisibleApartment(id, viewer);
  return { apartment: isOwner || isAdmin ? apartmentOwnerView(apartment) : apartmentPublic(apartment) };
}

// ---------------------------------------------------------------- לוח תפוסה

export async function getCalendar(id: number, viewer: Viewer, q: { from?: string; to?: string }) {
  const { isOwner } = await getVisibleApartment(id, viewer);
  const today = todayYmd();
  const from = q.from ?? today;
  const to = q.to ?? maxAllowedYmd(today);
  assertValidRange(from, to, { startField: 'from', endField: 'to' });

  await expireStale();
  const range = { startDate: { lte: ymdToDate(to) }, endDate: { gte: ymdToDate(from) } };

  const [swaps, blocks] = await Promise.all([
    prisma.swapOffer.findMany({
      where: { status: 'APPROVED', OR: [{ senderApartmentId: id }, { receiverApartmentId: id }], ...range },
      select: { startDate: true, endDate: true },
    }),
    prisma.blockedDate.findMany({
      where: { apartmentId: id, ...range },
      select: { startDate: true, endDate: true },
    }),
  ]);

  const busyRanges = [
    ...swaps.map((s) => ({ startDate: dateToYmd(s.startDate), endDate: dateToYmd(s.endDate), reason: 'SWAP' as const })),
    ...blocks.map((b) => ({
      startDate: dateToYmd(b.startDate),
      endDate: dateToYmd(b.endDate),
      reason: 'BLOCKED' as const,
    })),
  ].sort((a, b) => a.startDate.localeCompare(b.startDate));

  const result: {
    apartmentId: number;
    from: string;
    to: string;
    busyRanges: typeof busyRanges;
    pendingRanges?: { swapId: number; startDate: string; endDate: string; direction: 'SENT' | 'RECEIVED' }[];
  } = { apartmentId: id, from, to, busyRanges };

  // לבעל הדירה בלבד: גם הצעות ממתינות
  if (isOwner) {
    const pending = await prisma.swapOffer.findMany({
      where: { status: 'PENDING', OR: [{ senderApartmentId: id }, { receiverApartmentId: id }], ...range },
      select: { id: true, startDate: true, endDate: true, receiverApartmentId: true },
      orderBy: { startDate: 'asc' },
    });
    result.pendingRanges = pending.map((p) => ({
      swapId: p.id,
      startDate: dateToYmd(p.startDate),
      endDate: dateToYmd(p.endDate),
      direction: (p.receiverApartmentId === id ? 'RECEIVED' : 'SENT') as 'RECEIVED' | 'SENT',
    }));
  }

  return result;
}

// ---------------------------------------------------------------- הדירה שלי

async function getOwnApartment(userId: number) {
  const apartment = await prisma.apartment.findUnique({ where: { ownerId: userId }, include: { city: true } });
  if (!apartment) throw notFound('NO_APARTMENT', 'עדיין לא פרסמת דירה');
  return apartment;
}

/** העיר חייבת להיות קיימת ופעילה; עיר שהושבתה מותרת רק אם הדירה כבר נמצאת בה */
async function assertCityAllowed(cityId: number, currentCityId?: number) {
  const city = await prisma.city.findUnique({ where: { id: cityId } });
  if (!city || (!city.isActive && city.id !== currentCityId)) {
    throw validationError([{ field: 'cityId', message: 'העיר שנבחרה לא קיימת או אינה פעילה' }]);
  }
}

export async function getMyApartment(userId: number) {
  return { apartment: apartmentOwnerView(await getOwnApartment(userId)) };
}

export async function createMyApartment(userId: number, input: ApartmentInput) {
  const existing = await prisma.apartment.findUnique({ where: { ownerId: userId }, select: { id: true } });
  if (existing) throw conflict('APARTMENT_EXISTS', 'כבר פרסמת דירה. אפשר לערוך אותה במסך "הדירה שלי"');
  await assertCityAllowed(input.cityId);

  const apartment = await prisma.apartment.create({
    data: { ...input, ownerId: userId },
    include: { city: true },
  });
  return { apartment: apartmentOwnerView(apartment) };
}

export async function updateMyApartment(userId: number, input: ApartmentInput) {
  const current = await getOwnApartment(userId);
  if (input.cityId !== current.cityId) await assertCityAllowed(input.cityId, current.cityId);

  const apartment = await prisma.apartment.update({
    where: { id: current.id },
    data: input,
    include: { city: true },
  });
  return { apartment: apartmentOwnerView(apartment) };
}

export async function setMyApartmentStatus(userId: number, status: 'ACTIVE' | 'HIDDEN') {
  const current = await getOwnApartment(userId);
  if (current.isBlocked) {
    throw forbidden(
      'APARTMENT_BLOCKED',
      'הדירה חסומה על ידי מנהל האתר, ולכן אי אפשר לשנות את הסטטוס שלה. לבירור יש לפנות למנהל האתר',
    );
  }
  const apartment = await prisma.apartment.update({
    where: { id: current.id },
    data: { status },
    include: { city: true },
  });
  return { apartment: apartmentOwnerView(apartment) };
}

// ---------------------------------------------------------------- חסימות ידניות

function publicBlock(b: { id: number; startDate: Date; endDate: Date; note: string | null }) {
  return { id: b.id, startDate: dateToYmd(b.startDate), endDate: dateToYmd(b.endDate), note: b.note };
}

/** חסימות נוכחיות ועתידיות בלבד */
export async function listMyBlockedDates(userId: number) {
  const apartment = await getOwnApartment(userId);
  const blocks = await prisma.blockedDate.findMany({
    where: { apartmentId: apartment.id, endDate: { gte: ymdToDate(todayYmd()) } },
    orderBy: { startDate: 'asc' },
  });
  return blocks.map(publicBlock);
}

export async function addMyBlockedDate(userId: number, input: BlockedDateInput) {
  const apartment = await getOwnApartment(userId);
  assertValidRange(input.startDate, input.endDate, {
    startField: 'startDate',
    endField: 'endDate',
    maxDays: MAX_RANGE_DAYS,
  });
  const start = ymdToDate(input.startDate);
  const end = ymdToDate(input.endDate);

  return prisma.$transaction(async (tx) => {
    await lockApartments(tx, [apartment.id]);
    if (await isApartmentBusy(tx, apartment.id, start, end)) {
      throw conflict('DATES_UNAVAILABLE', 'התאריכים חופפים להחלפה מאושרת או לחסימה קיימת');
    }
    const block = await tx.blockedDate.create({
      data: { apartmentId: apartment.id, startDate: start, endDate: end, note: input.note },
    });
    // הצעות ממתינות על התאריכים האלה כבר לא יוכלו להתאשר, ולכן נדחות אוטומטית
    const autoRejectedOffers = await autoRejectOverlapping(tx, [apartment.id], start, end);
    return { blockedDate: publicBlock(block), autoRejectedOffers };
  });
}

export async function removeMyBlockedDate(userId: number, blockId: number) {
  const apartment = await getOwnApartment(userId);
  const block = await prisma.blockedDate.findFirst({ where: { id: blockId, apartmentId: apartment.id } });
  if (!block) throw notFound('BLOCK_NOT_FOUND', 'החסימה לא נמצאה');
  if (dateToYmd(block.endDate) < todayYmd()) {
    throw conflict('BLOCK_IN_PAST', 'אי אפשר למחוק חסימה שכבר הסתיימה');
  }
  await prisma.blockedDate.delete({ where: { id: block.id } });
}
