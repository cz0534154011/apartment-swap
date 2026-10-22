import type { Apartment, City, User } from '@prisma/client';

export type ApartmentWithCity = Apartment & { city: City };
export type ApartmentWithCityOwner = ApartmentWithCity & { owner: User };

/** מה שכל גולש רואה. בלי פרטי בעל הדירה */
export function apartmentPublic(a: ApartmentWithCity) {
  return {
    id: a.id,
    title: a.title,
    city: { id: a.city.id, name: a.city.name },
    neighborhood: a.neighborhood,
    rooms: Number(a.rooms),
    beds: a.beds,
    floor: a.floor,
    hasElevator: a.hasElevator,
    hasPlata: a.hasPlata,
    hasUrn: a.hasUrn,
    hasShabbatClock: a.hasShabbatClock,
    hasEruv: a.hasEruv,
    hasGenerator: a.hasGenerator,
    description: a.description,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

/** מה שבעל הדירה והמנהל רואים: גם סטטוס ומידע על חסימה */
export function apartmentOwnerView(a: ApartmentWithCity) {
  return {
    ...apartmentPublic(a),
    status: a.status,
    isBlocked: a.isBlocked,
    blockReason: a.blockReason,
    blockedAt: a.blockedAt ? a.blockedAt.toISOString() : null,
  };
}

/** תצוגת מנהל: כולל פרטי בעל הדירה */
export function apartmentAdminView(a: ApartmentWithCityOwner) {
  return {
    ...apartmentOwnerView(a),
    owner: { id: a.owner.id, fullName: a.owner.fullName, email: a.owner.email, phone: a.owner.phone },
  };
}

/** תקציר דירה לתצוגה בתוך הצעות החלפה */
export function apartmentSummary(a: ApartmentWithCity) {
  return {
    id: a.id,
    title: a.title,
    city: { id: a.city.id, name: a.city.name },
    neighborhood: a.neighborhood,
    rooms: Number(a.rooms),
    beds: a.beds,
  };
}
