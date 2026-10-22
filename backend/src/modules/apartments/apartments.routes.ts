import { Router } from 'express';
import { optionalAuth, requireAuth, requireRole } from '../../middleware/auth.js';
import * as controller from './apartments.controller.js';

/** /api/apartments: חיפוש וצפייה, פתוח לכולם */
export const apartmentsRouter = Router();
apartmentsRouter.get('/', optionalAuth, controller.search);
apartmentsRouter.get('/:id', optionalAuth, controller.getById);
apartmentsRouter.get('/:id/calendar', optionalAuth, controller.calendar);

/** /api/my/apartment: הדירה של המשתמש המחובר. הדירה נמצאת לפי ה-Token, בלי מזהה בכתובת */
export const myApartmentRouter = Router();
myApartmentRouter.use(requireAuth, requireRole('USER'));
myApartmentRouter.get('/apartment', controller.getMine);
myApartmentRouter.post('/apartment', controller.createMine);
myApartmentRouter.put('/apartment', controller.updateMine);
myApartmentRouter.patch('/apartment/status', controller.setMyStatus);
myApartmentRouter.get('/apartment/blocked-dates', controller.listMyBlocks);
myApartmentRouter.post('/apartment/blocked-dates', controller.addMyBlock);
myApartmentRouter.delete('/apartment/blocked-dates/:id', controller.removeMyBlock);
