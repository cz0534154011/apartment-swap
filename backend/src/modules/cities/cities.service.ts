import type { City } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { conflict, notFound } from '../../utils/errors.js';

export function publicCity(city: City) {
  return { id: city.id, name: city.name, isActive: city.isActive };
}

export async function listCities(includeInactive: boolean) {
  const cities = await prisma.city.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: 'asc' },
  });
  return cities.map(publicCity);
}

async function assertNameFree(name: string, exceptId?: number) {
  const existing = await prisma.city.findFirst({
    where: { name: { equals: name, mode: 'insensitive' }, ...(exceptId ? { id: { not: exceptId } } : {}) },
  });
  if (existing) throw conflict('CITY_EXISTS', 'עיר בשם הזה כבר קיימת');
}

export async function createCity(name: string) {
  await assertNameFree(name);
  return publicCity(await prisma.city.create({ data: { name } }));
}

export async function updateCity(id: number, data: { name?: string; isActive?: boolean }) {
  const city = await prisma.city.findUnique({ where: { id } });
  if (!city) throw notFound('CITY_NOT_FOUND', 'העיר לא נמצאה');
  if (data.name !== undefined) await assertNameFree(data.name, id);
  return publicCity(await prisma.city.update({ where: { id }, data }));
}

export async function deleteCity(id: number) {
  const city = await prisma.city.findUnique({ where: { id }, include: { _count: { select: { apartments: true } } } });
  if (!city) throw notFound('CITY_NOT_FOUND', 'העיר לא נמצאה');
  if (city._count.apartments > 0) {
    throw conflict('CITY_IN_USE', 'אי אפשר למחוק עיר שיש בה דירות. אפשר להשבית אותה במקום');
  }
  await prisma.city.delete({ where: { id } });
}
