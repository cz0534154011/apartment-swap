import type { Prisma } from '@prisma/client';
import type { z } from 'zod';
import { prisma } from '../../db/prisma.js';
import { conflict, notFound } from '../../utils/errors.js';
import { paginate, skipTake } from '../../utils/pagination.js';
import { apartmentAdminView } from '../apartments/apartments.serializer.js';
import { autoRejectAllPending, expireStale, lockApartments } from '../swaps/availability.js';
import { swapAdminListItem, swapInclude } from '../swaps/swaps.serializer.js';
import type {
  adminApartmentsQuerySchema,
  adminSwapsQuerySchema,
  adminUsersQuerySchema,
} from './admin.schemas.js';

type ApartmentsQuery = z.infer<typeof adminApartmentsQuerySchema>;
type UsersQuery = z.infer<typeof adminUsersQuerySchema>;
type SwapsQuery = z.infer<typeof adminSwapsQuerySchema>;

const contains = (value: string) => ({ contains: value, mode: 'insensitive' as const });

// ---------------------------------------------------------------- דירות

export async function listApartments(q: ApartmentsQuery) {
  const owner: Prisma.UserWhereInput = {
    ...(q.ownerEmail ? { email: contains(q.ownerEmail) } : {}),
    ...(q.ownerPhone ? { phone: { contains: q.ownerPhone } } : {}),
  };
  const where: Prisma.ApartmentWhereInput = {
    ...(q.cityId ? { cityId: q.cityId } : {}),
    ...(q.status ? { status: q.status } : {}),
    ...(q.isBlocked !== undefined ? { isBlocked: q.isBlocked } : {}),
    ...(Object.keys(owner).length > 0 ? { owner } : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.apartment.findMany({
      where,
      include: { city: true, owner: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...skipTake(q.page, q.pageSize),
    }),
    prisma.apartment.count({ where }),
  ]);
  return paginate(items.map(apartmentAdminView), total, q.page, q.pageSize);
}

export async function blockApartment(id: number, reason: string) {
  return prisma.$transaction(async (tx) => {
    const exists = await tx.apartment.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw notFound('APARTMENT_NOT_FOUND', 'הדירה לא נמצאה');
    await lockApartments(tx, [id]);

    const current = await tx.apartment.findUniqueOrThrow({ where: { id } });
    if (current.isBlocked) throw conflict('ALREADY_BLOCKED', 'הדירה כבר חסומה');

    const apartment = await tx.apartment.update({
      where: { id },
      data: { isBlocked: true, blockReason: reason, blockedAt: new Date() },
      include: { city: true, owner: true },
    });
    // הצעות ממתינות של הדירה נדחות; החלפות שכבר אושרו נשארות בתוקף
    const autoRejectedOffers = await autoRejectAllPending(tx, id);
    return { apartment: apartmentAdminView(apartment), autoRejectedOffers };
  });
}

export async function unblockApartment(id: number) {
  const current = await prisma.apartment.findUnique({ where: { id } });
  if (!current) throw notFound('APARTMENT_NOT_FOUND', 'הדירה לא נמצאה');
  if (!current.isBlocked) throw conflict('NOT_BLOCKED', 'הדירה אינה חסומה');
  const apartment = await prisma.apartment.update({
    where: { id },
    data: { isBlocked: false, blockReason: null, blockedAt: null },
    include: { city: true, owner: true },
  });
  return { apartment: apartmentAdminView(apartment) };
}

// ---------------------------------------------------------------- משתמשים

export async function listUsers(q: UsersQuery) {
  const where: Prisma.UserWhereInput = {
    ...(q.name ? { fullName: contains(q.name) } : {}),
    ...(q.email ? { email: contains(q.email) } : {}),
    ...(q.phone ? { phone: { contains: q.phone } } : {}),
  };
  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      include: { apartment: { select: { id: true, title: true, status: true, isBlocked: true } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...skipTake(q.page, q.pageSize),
    }),
    prisma.user.count({ where }),
  ]);
  return paginate(
    items.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
      apartment: u.apartment,
    })),
    total,
    q.page,
    q.pageSize,
  );
}

// ---------------------------------------------------------------- החלפות

export async function listSwaps(q: SwapsQuery) {
  await expireStale();
  const where: Prisma.SwapOfferWhereInput = {
    ...(q.apartmentId
      ? { OR: [{ senderApartmentId: q.apartmentId }, { receiverApartmentId: q.apartmentId }] }
      : {}),
    ...(q.status ? { status: q.status } : {}),
  };
  const [items, total] = await prisma.$transaction([
    prisma.swapOffer.findMany({
      where,
      include: swapInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...skipTake(q.page, q.pageSize),
    }),
    prisma.swapOffer.count({ where }),
  ]);
  return paginate(items.map(swapAdminListItem), total, q.page, q.pageSize);
}
