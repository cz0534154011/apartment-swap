import { Router } from 'express';
import * as controller from './site.controller.js';

export const siteRouter = Router();

siteRouter.get('/health', controller.health);
siteRouter.get('/site-info', controller.siteInfo);
