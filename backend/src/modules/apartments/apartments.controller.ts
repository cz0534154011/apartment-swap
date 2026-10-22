import type { Request, Response } from 'express';
import { currentUser } from '../../middleware/auth.js';
import { idParamSchema } from '../../utils/validation.js';
import {
  apartmentInputSchema,
  apartmentStatusSchema,
  blockedDateInputSchema,
  calendarQuerySchema,
  searchQuerySchema,
} from './apartments.schemas.js';
import * as service from './apartments.service.js';

// ---- ציבורי

export async function search(req: Request, res: Response) {
  const query = searchQuerySchema.parse(req.query);
  res.json(await service.searchApartments(query, req.user));
}

export async function getById(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.json(await service.getApartment(id, req.user));
}

export async function calendar(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const query = calendarQuerySchema.parse(req.query);
  res.json(await service.getCalendar(id, req.user, query));
}

// ---- הדירה שלי

export async function getMine(req: Request, res: Response) {
  res.json(await service.getMyApartment(currentUser(req).id));
}

export async function createMine(req: Request, res: Response) {
  const input = apartmentInputSchema.parse(req.body);
  res.status(201).json(await service.createMyApartment(currentUser(req).id, input));
}

export async function updateMine(req: Request, res: Response) {
  const input = apartmentInputSchema.parse(req.body);
  res.json(await service.updateMyApartment(currentUser(req).id, input));
}

export async function setMyStatus(req: Request, res: Response) {
  const { status } = apartmentStatusSchema.parse(req.body);
  res.json(await service.setMyApartmentStatus(currentUser(req).id, status));
}

export async function listMyBlocks(req: Request, res: Response) {
  res.json(await service.listMyBlockedDates(currentUser(req).id));
}

export async function addMyBlock(req: Request, res: Response) {
  const input = blockedDateInputSchema.parse(req.body);
  res.status(201).json(await service.addMyBlockedDate(currentUser(req).id, input));
}

export async function removeMyBlock(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  await service.removeMyBlockedDate(currentUser(req).id, id);
  res.status(204).end();
}
