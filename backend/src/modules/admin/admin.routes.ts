import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import * as controller from './admin.controller.js';

/** /api/admin: מנהל בלבד */
export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('ADMIN'));

adminRouter.get('/apartments', controller.listApartments);
adminRouter.post('/apartments/:id/block', controller.blockApartment);
adminRouter.post('/apartments/:id/unblock', controller.unblockApartment);
adminRouter.get('/users', controller.listUsers);
adminRouter.get('/swaps', controller.listSwaps);
