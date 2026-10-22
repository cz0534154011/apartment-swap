import type { Request, Response } from 'express';
import { idParamSchema } from '../../utils/validation.js';
import {
  adminApartmentsQuerySchema,
  adminSwapsQuerySchema,
  adminUsersQuerySchema,
  blockApartmentSchema,
} from './admin.schemas.js';
import * as service from './admin.service.js';

export async function listApartments(req: Request, res: Response) {
  res.json(await service.listApartments(adminApartmentsQuerySchema.parse(req.query)));
}

export async function blockApartment(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const { reason } = blockApartmentSchema.parse(req.body);
  res.json(await service.blockApartment(id, reason));
}

export async function unblockApartment(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.json(await service.unblockApartment(id));
}

export async function listUsers(req: Request, res: Response) {
  res.json(await service.listUsers(adminUsersQuerySchema.parse(req.query)));
}

export async function listSwaps(req: Request, res: Response) {
  res.json(await service.listSwaps(adminSwapsQuerySchema.parse(req.query)));
}
