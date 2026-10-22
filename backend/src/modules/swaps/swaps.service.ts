import type { Prisma, Role } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { assertValidRange, dateToYmd, MAX_RANGE_DAYS, todayYmd, ymdToDate } from '../../utils/dates.js';
import { AppError, badRequest, conflict, forbidden, notFound } from '../../utils/errors.js';
import { paginate, skipTake } from '../../utils/pagination.js';
import { autoRejectOverlapping, expireStale, isApartmentBusy, lockApartments } from './availability.js';
import type { CreateSwapInput, ListSwapsQuery } from './swaps.schemas.js';
import {
  hasOpenCancelRequest,
  sideOf,
  swapDetail,
  swapInclude,
  swapListItem,
  type Side,
  type SwapFull,
} from './swaps.serializer.js';

type Actor = { id: number; role: Role };

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'ממתינה',
  APPROVED: 'מאושרת',
  REJECTED: 'נדחתה',
  AUTO_REJECTED: 'נדחתה אוטומטית',
  WITHDRAWN: 'נמשכה',
  CANCELLED: 'בוטלה',
  EXPIRED: 'פג תוקף',
};

const swapNotFound = () => notFound('SWAP_NOT_FOUND', 'ההחלפה לא נמצאה');

function invalidState(swap: { status: string }, message: string): AppError {
  return conflict('INVALID_STATE', `${message} (מצב נוכחי: ${STATUS_LABELS[swap.status] ?? swap.status})`);
}

// ---------------------------------------------------------------- שליחת הצעה

export async function createSwap(actor: Actor, input: CreateSwapInput) {
  assertValidRange(input.startDate, input.endDate, {
    startField: 'startDate',
    endField: 'endDate',
    maxDays: MAX_RANGE_DAYS,
  });
  await expireStale();

  const mine = await prisma.apartment.findUnique({ where: { ownerId: actor.id } });
  if (!mine) throw forbidden('NO_APARTMENT', 'כדי לשלוח הצעת החלפה יש לפרסם קודם את הדירה שלך');
  if (mine.isBlocked) {
    throw forbidden('APARTMENT_BLOCKED', 'הדירה שלך חסומה על ידי מנהל האתר, ולכן אי אפשר לשלוח הצעות');
  }
  if (mine.status !== 'ACTIVE') {
    throw forbidden('APARTMENT_HIDDEN', 'הדירה שלך מוסתרת. יש להפוך אותה לפעילה כדי לשלוח הצעות');
  }
  if (input.receiverApartmentId === mine.id) {
    throw badRequest('CANNOT_OFFER_OWN_APARTMENT', 'אי אפשר לשלוח הצעת החלפה לדירה שלך');
  }

  const target = await prisma.apartment.findUnique({ where: { id: input.receiverApartmentId } });
  if (!target || target.status !== 'ACTIVE' || target.isBlocked) {
    throw notFound('APARTMENT_NOT_FOUND', 'הדירה המבוקשת לא נמצאה או שאינה זמינה כרגע');
  }

  const start = ymdToDate(input.startDate);
  const end = ymdToDate(input.endDate);

  if (await isApartmentBusy(prisma, mine.id, start, end)) {
    throw conflict('DATES_UNAVAILABLE', 'הדירה שלך כבר תפוסה בחלק מהתאריכים האלה');
  }
  if (await isApartmentBusy(prisma, target.id, start, end)) {
    throw conflict('DATES_UNAVAILABLE', 'הדירה המבוקשת כבר תפוסה בחלק מהתאריכים האלה');
  }

  const duplicate = await prisma.swapOffer.findFirst({
    where: {
      status: 'PENDING',
      senderApartmentId: mine.id,
      receiverApartmentId: target.id,
      startDate: { lte: end },
      endDate: { gte: start },
    },
    select: { id: true },
  });
  if (duplicate) {
    throw conflict('DUPLICATE_OFFER', 'כבר שלחת לדירה הזו הצעה ממתינה בתאריכים חופפים');
  }

  const swap = await prisma.swapOffer.create({
    data: {
      senderApartmentId: mine.id,
      receiverApartmentId: target.id,
      startDate: start,
      endDate: end,
      message: input.message,
    },
    include: swapInclude,
  });
  return { swap: swapDetail(swap, 'SENDER', actor.id, false, todayYmd()) };
}

// ---------------------------------------------------------------- צפייה

export async function listMySwaps(actor: Actor, query: ListSwapsQuery) {
  await expireStale();
  const mine = await prisma.apartment.findUnique({ where: { ownerId: actor.id }, select: { id: true } });
  if (!mine) return paginate([], 0, query.page, query.pageSize);

  const boxWhere: Prisma.SwapOfferWhereInput =
    query.box === 'received'
      ? { receiverApartmentId: mine.id }
      : query.box === 'sent'
        ? { senderApartmentId: mine.id }
        : { OR: [{ receiverApartmentId: mine.id }, { senderApartmentId: mine.id }] };
  const where: Prisma.SwapOfferWhereInput = { ...boxWhere, ...(query.status ? { status: query.status } : {}) };

  const [items, total] = await prisma.$transaction([
    prisma.swapOffer.findMany({
      where,
      include: swapInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...skipTake(query.page, query.pageSize),
    }),
    prisma.swapOffer.count({ where }),
  ]);

  return paginate(
    items.map((s) => swapListItem(s, s.senderApartmentId === mine.id ? 'SENDER' : 'RECEIVER', actor.id)),
    total,
    query.page,
    query.pageSize,
  );
}

export async function getSwap(actor: Actor, id: number) {
  await expireStale();
  const swap = await prisma.swapOffer.findUnique({ where: { id }, include: swapInclude });
  if (!swap) throw swapNotFound();
  const side = sideOf(swap, actor.id);
  const isAdmin = actor.role === 'ADMIN';
  // מי שאינו צד בהחלפה מקבל "לא נמצא", כדי לא לחשוף שהיא קיימת
  if (!side && !isAdmin) throw swapNotFound();
  return { swap: swapDetail(swap, side, actor.id, isAdmin, todayYmd()) };
}

// ---------------------------------------------------------------- פעולות

/**
 * מריץ פעולה על החלפה בתוך טרנזקציה, אחרי נעילת שתי הדירות.
 * בתוך הנעילה ההחלפה נטענת מחדש, כך שהבדיקות נעשות על המצב העדכני ביותר.
 */
async function withLockedSwap(
  actor: Actor,
  id: number,
  action: (tx: Prisma.TransactionClient, swap: SwapFull, side: Exclude<Side, null>, today: string) => Promise<void>,
) {
  await expireStale();
  await prisma.$transaction(async (tx) => {
    const ref = await tx.swapOffer.findUnique({
      where: { id },
      select: { senderApartmentId: true, receiverApartmentId: true },
    });
    if (!ref) throw swapNotFound();
    await lockApartments(tx, [ref.senderApartmentId, ref.receiverApartmentId]);

    const swap = await tx.swapOffer.findUnique({ where: { id }, include: swapInclude });
    if (!swap) throw swapNotFound();
    const side = sideOf(swap, actor.id);
    if (!side) throw swapNotFound();
    await action(tx, swap, side, todayYmd());
  });
  return getSwap(actor, id);
}

export function approveSwap(actor: Actor, id: number) {
  return withLockedSwap(actor, id, async (tx, swap, side, today) => {
    if (side !== 'RECEIVER') throw forbidden('ACTION_NOT_ALLOWED', 'רק מי שקיבל את ההצעה יכול לאשר אותה');
    if (swap.status !== 'PENDING') throw invalidState(swap, 'אפשר לאשר רק הצעה ממתינה');
    if (dateToYmd(swap.startDate) < today) throw conflict('SWAP_EXPIRED', 'תאריך ההתחלה של ההצעה כבר עבר');
    if (swap.senderApartment.isBlocked || swap.receiverApartment.isBlocked) {
      throw conflict('APARTMENT_BLOCKED', 'אחת הדירות חסומה על ידי מנהל האתר, ולכן אי אפשר לאשר את ההצעה');
    }

    // בדיקה חוזרת: ייתכן שמאז שליחת ההצעה משהו אחר אושר או נחסם
    for (const apartmentId of [swap.receiverApartmentId, swap.senderApartmentId]) {
      if (await isApartmentBusy(tx, apartmentId, swap.startDate, swap.endDate, swap.id)) {
        throw conflict(
          'DATES_UNAVAILABLE',
          apartmentId === swap.receiverApartmentId
            ? 'הדירה שלך כבר תפוסה בחלק מהתאריכים של ההצעה'
            : 'הדירה של המציע כבר תפוסה בחלק מהתאריכים של ההצעה',
        );
      }
    }

    await tx.swapOffer.update({ where: { id: swap.id }, data: { status: 'APPROVED', respondedAt: new Date() } });
    // כל ההצעות הממתינות האחרות של שתי הדירות שחופפות לתאריכים נדחות אוטומטית
    await autoRejectOverlapping(
      tx,
      [swap.senderApartmentId, swap.receiverApartmentId],
      swap.startDate,
      swap.endDate,
      swap.id,
    );
  });
}

export function rejectSwap(actor: Actor, id: number) {
  return withLockedSwap(actor, id, async (tx, swap, side) => {
    if (side !== 'RECEIVER') throw forbidden('ACTION_NOT_ALLOWED', 'רק מי שקיבל את ההצעה יכול לדחות אותה');
    if (swap.status !== 'PENDING') throw invalidState(swap, 'אפשר לדחות רק הצעה ממתינה');
    await tx.swapOffer.update({ where: { id: swap.id }, data: { status: 'REJECTED', respondedAt: new Date() } });
  });
}

export function withdrawSwap(actor: Actor, id: number) {
  return withLockedSwap(actor, id, async (tx, swap, side) => {
    if (side !== 'SENDER') throw forbidden('ACTION_NOT_ALLOWED', 'רק מי ששלח את ההצעה יכול למשוך אותה');
    if (swap.status !== 'PENDING') throw invalidState(swap, 'אפשר למשוך רק הצעה ממתינה');
    await tx.swapOffer.update({ where: { id: swap.id }, data: { status: 'WITHDRAWN' } });
  });
}

/** בדיקות משותפות לכל פעולות הביטול */
function assertCancellable(swap: SwapFull, today: string) {
  if (swap.status !== 'APPROVED') throw invalidState(swap, 'אפשר לבטל רק החלפה מאושרת');
  if (today >= dateToYmd(swap.startDate)) {
    throw conflict('SWAP_STARTED', 'אי אפשר לבטל החלפה שתאריך ההתחלה שלה כבר הגיע');
  }
}

export function requestCancel(actor: Actor, id: number, reason: string | null) {
  return withLockedSwap(actor, id, async (tx, swap, _side, today) => {
    assertCancellable(swap, today);
    if (hasOpenCancelRequest(swap)) {
      throw conflict('CANCEL_REQUEST_EXISTS', 'כבר קיימת בקשת ביטול פתוחה להחלפה הזו');
    }
    await tx.swapOffer.update({
      where: { id: swap.id },
      data: { cancelRequestedById: actor.id, cancelRequestReason: reason, cancelRequestedAt: new Date() },
    });
  });
}

function assertOpenRequest(swap: SwapFull) {
  if (!hasOpenCancelRequest(swap)) throw conflict('NO_CANCEL_REQUEST', 'אין בקשת ביטול פתוחה להחלפה הזו');
}

export function approveCancel(actor: Actor, id: number) {
  return withLockedSwap(actor, id, async (tx, swap, _side, today) => {
    assertCancellable(swap, today);
    assertOpenRequest(swap);
    if (swap.cancelRequestedById === actor.id) {
      throw forbidden('ACTION_NOT_ALLOWED', 'רק הצד השני יכול לאשר את בקשת הביטול');
    }
    await tx.swapOffer.update({ where: { id: swap.id }, data: { status: 'CANCELLED', cancelledAt: new Date() } });
  });
}

export function rejectCancel(actor: Actor, id: number) {
  return withLockedSwap(actor, id, async (tx, swap, _side, today) => {
    assertCancellable(swap, today);
    assertOpenRequest(swap);
    if (swap.cancelRequestedById === actor.id) {
      throw forbidden('ACTION_NOT_ALLOWED', 'רק הצד השני יכול לסרב לבקשת הביטול');
    }
    await tx.swapOffer.update({
      where: { id: swap.id },
      data: { cancelRequestedById: null, cancelRequestReason: null, cancelRequestedAt: null },
    });
  });
}

export function withdrawCancelRequest(actor: Actor, id: number) {
  return withLockedSwap(actor, id, async (tx, swap, _side, today) => {
    assertCancellable(swap, today);
    assertOpenRequest(swap);
    if (swap.cancelRequestedById !== actor.id) {
      throw forbidden('ACTION_NOT_ALLOWED', 'רק מי שביקש את הביטול יכול למשוך את הבקשה');
    }
    await tx.swapOffer.update({
      where: { id: swap.id },
      data: { cancelRequestedById: null, cancelRequestReason: null, cancelRequestedAt: null },
    });
  });
}
