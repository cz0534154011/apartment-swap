import type { Prisma } from '@prisma/client';
import { dateToYmd } from '../../utils/dates.js';
import { apartmentSummary } from '../apartments/apartments.serializer.js';

export const swapInclude = {
  senderApartment: { include: { city: true, owner: true } },
  receiverApartment: { include: { city: true, owner: true } },
} satisfies Prisma.SwapOfferInclude;

export type SwapFull = Prisma.SwapOfferGetPayload<{ include: typeof swapInclude }>;

export type Side = 'SENDER' | 'RECEIVER' | null;

/** באיזה צד של ההחלפה נמצא המשתמש (לפי בעלות על הדירות) */
export function sideOf(swap: SwapFull, userId: number): Side {
  if (swap.senderApartment.ownerId === userId) return 'SENDER';
  if (swap.receiverApartment.ownerId === userId) return 'RECEIVER';
  return null;
}

export function hasOpenCancelRequest(swap: { status: string; cancelRequestedById: number | null }): boolean {
  return swap.status === 'APPROVED' && swap.cancelRequestedById !== null;
}

/**
 * אילו פעולות מותרות עכשיו למשתמש הזה על ההחלפה הזו.
 * ה-React משתמש בזה כדי לדעת אילו כפתורים להציג.
 */
export function allowedActions(swap: SwapFull, side: Side, userId: number, today: string) {
  const start = dateToYmd(swap.startDate);
  const pending = swap.status === 'PENDING';
  const approved = swap.status === 'APPROVED';
  const openCancel = hasOpenCancelRequest(swap);
  const beforeStart = today < start;
  const requestedByMe = swap.cancelRequestedById === userId;

  return {
    canApprove: side === 'RECEIVER' && pending && start >= today,
    canReject: side === 'RECEIVER' && pending,
    canWithdraw: side === 'SENDER' && pending,
    canRequestCancel: side !== null && approved && !openCancel && beforeStart,
    canApproveCancel: side !== null && openCancel && !requestedByMe && beforeStart,
    canRejectCancel: side !== null && openCancel && !requestedByMe && beforeStart,
    canWithdrawCancelRequest: side !== null && openCancel && requestedByMe && beforeStart,
  };
}

function direction(side: Side): 'SENT' | 'RECEIVED' | null {
  if (side === 'SENDER') return 'SENT';
  if (side === 'RECEIVER') return 'RECEIVED';
  return null;
}

/** פרטי החלפה מלאים */
export function swapDetail(swap: SwapFull, side: Side, userId: number, isAdmin: boolean, today: string) {
  const other = side === 'SENDER' ? swap.receiverApartment.owner : side === 'RECEIVER' ? swap.senderApartment.owner : null;
  // פרטי הקשר נחשפים רק לצדדים, ורק כשההצעה ממתינה או מאושרת
  const contactVisible = other !== null && (swap.status === 'PENDING' || swap.status === 'APPROVED');

  return {
    id: swap.id,
    status: swap.status,
    startDate: dateToYmd(swap.startDate),
    endDate: dateToYmd(swap.endDate),
    message: swap.message,
    direction: direction(side),
    senderApartment: apartmentSummary(swap.senderApartment),
    receiverApartment: apartmentSummary(swap.receiverApartment),
    cancelRequest:
      swap.cancelRequestedById !== null
        ? {
            isOpen: hasOpenCancelRequest(swap),
            requestedById: swap.cancelRequestedById,
            requestedByMe: swap.cancelRequestedById === userId,
            reason: swap.cancelRequestReason,
            requestedAt: swap.cancelRequestedAt ? swap.cancelRequestedAt.toISOString() : null,
          }
        : null,
    otherParty:
      contactVisible && other ? { fullName: other.fullName, email: other.email, phone: other.phone } : null,
    owners: isAdmin
      ? {
          sender: { id: swap.senderApartment.owner.id, fullName: swap.senderApartment.owner.fullName },
          receiver: { id: swap.receiverApartment.owner.id, fullName: swap.receiverApartment.owner.fullName },
        }
      : undefined,
    allowedActions: allowedActions(swap, side, userId, today),
    createdAt: swap.createdAt.toISOString(),
    respondedAt: swap.respondedAt ? swap.respondedAt.toISOString() : null,
    cancelledAt: swap.cancelledAt ? swap.cancelledAt.toISOString() : null,
  };
}

/** שורה ברשימת "ההחלפות שלי" */
export function swapListItem(swap: SwapFull, side: Exclude<Side, null>, userId: number) {
  const otherApartment = side === 'SENDER' ? swap.receiverApartment : swap.senderApartment;
  return {
    id: swap.id,
    status: swap.status,
    startDate: dateToYmd(swap.startDate),
    endDate: dateToYmd(swap.endDate),
    direction: direction(side),
    otherApartment: apartmentSummary(otherApartment),
    hasOpenCancelRequest: hasOpenCancelRequest(swap),
    cancelRequestedByMe: hasOpenCancelRequest(swap) && swap.cancelRequestedById === userId,
    createdAt: swap.createdAt.toISOString(),
  };
}

/** שורה ברשימת ההחלפות של המנהל */
export function swapAdminListItem(swap: SwapFull) {
  const withOwner = (a: SwapFull['senderApartment']) => ({
    ...apartmentSummary(a),
    owner: { id: a.owner.id, fullName: a.owner.fullName },
  });
  return {
    id: swap.id,
    status: swap.status,
    startDate: dateToYmd(swap.startDate),
    endDate: dateToYmd(swap.endDate),
    senderApartment: withOwner(swap.senderApartment),
    receiverApartment: withOwner(swap.receiverApartment),
    hasOpenCancelRequest: hasOpenCancelRequest(swap),
    createdAt: swap.createdAt.toISOString(),
  };
}
