import type { Request, Response } from 'express';
import { currentUser } from '../../middleware/auth.js';
import { idParamSchema } from '../../utils/validation.js';
import { cancelRequestSchema, createSwapSchema, listSwapsQuerySchema } from './swaps.schemas.js';
import * as service from './swaps.service.js';

export async function create(req: Request, res: Response) {
  const input = createSwapSchema.parse(req.body);
  res.status(201).json(await service.createSwap(currentUser(req), input));
}

export async function list(req: Request, res: Response) {
  const query = listSwapsQuerySchema.parse(req.query);
  res.json(await service.listMySwaps(currentUser(req), query));
}

export async function getById(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.json(await service.getSwap(currentUser(req), id));
}

export async function approve(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.json(await service.approveSwap(currentUser(req), id));
}

export async function reject(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.json(await service.rejectSwap(currentUser(req), id));
}

export async function withdraw(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.json(await service.withdrawSwap(currentUser(req), id));
}

export async function requestCancel(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const { reason } = cancelRequestSchema.parse(req.body ?? {});
  res.json(await service.requestCancel(currentUser(req), id, reason));
}

export async function approveCancel(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.json(await service.approveCancel(currentUser(req), id));
}

export async function rejectCancel(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.json(await service.rejectCancel(currentUser(req), id));
}

export async function withdrawCancelRequest(req: Request, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  res.json(await service.withdrawCancelRequest(currentUser(req), id));
}
