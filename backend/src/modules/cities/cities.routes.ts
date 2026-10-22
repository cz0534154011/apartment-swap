import { Router } from 'express';
import { optionalAuth, requireAuth, requireRole } from '../../middleware/auth.js';
import * as controller from './cities.controller.js';

export const citiesRouter = Router();

citiesRouter.get('/', optionalAuth, controller.list);
citiesRouter.post('/', requireAuth, requireRole('ADMIN'), controller.create);
citiesRouter.patch('/:id', requireAuth, requireRole('ADMIN'), controller.update);
citiesRouter.delete('/:id', requireAuth, requireRole('ADMIN'), controller.remove);
