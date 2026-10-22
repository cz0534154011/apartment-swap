import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import * as controller from './swaps.controller.js';

export const swapsRouter = Router();
const userOnly = [requireAuth, requireRole('USER')];

swapsRouter.post('/', ...userOnly, controller.create);
swapsRouter.get('/', ...userOnly, controller.list);
// פרטי החלפה: צד בהחלפה או מנהל
swapsRouter.get('/:id', requireAuth, controller.getById);
swapsRouter.post('/:id/approve', ...userOnly, controller.approve);
swapsRouter.post('/:id/reject', ...userOnly, controller.reject);
swapsRouter.post('/:id/withdraw', ...userOnly, controller.withdraw);
swapsRouter.post('/:id/cancel-request', ...userOnly, controller.requestCancel);
swapsRouter.post('/:id/cancel-request/approve', ...userOnly, controller.approveCancel);
swapsRouter.post('/:id/cancel-request/reject', ...userOnly, controller.rejectCancel);
swapsRouter.post('/:id/cancel-request/withdraw', ...userOnly, controller.withdrawCancelRequest);
