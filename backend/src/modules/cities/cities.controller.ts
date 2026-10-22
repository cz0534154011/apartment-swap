import type { Request, Response } from 'express';
import { idParamSchema } from '../../utils/validation.js';
import { cityCreateSchema, cityListQuerySchema, cityUpdateSchema } from './cities.schemas.js';
import * as service from './cities.service.js';

/** רשימת ערים. ערים מושבתות מוחזרות רק למנהל שביקש includeInactive=true */
export async function list(req: Request, res: Response) {
  const { includeInactive } = cityListQuerySchema.parse(req.query);
  const isAdmin = req.user?.role === 'ADMIN';
  res.json(await service.listCities(Boolean(includeInactive) && isAdmin));
}

export async function create(req: Request, res: Response) {
  const { name } = cityCreateSchema.parse(req.body);
  res.status(201).json({ city: await service.createCity(name) });
}

export async function update(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const data = cityUpdateSchema.parse(req.body);
  res.json({ city: await service.updateCity(id, data) });
}

export async function remove(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  await service.deleteCity(id);
  res.status(204).end();
}
