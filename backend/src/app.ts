import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { corsOrigins } from './config/env.js';
import { docsRouter } from './docs/swagger.js';
import { errorHandler, routeNotFound } from './middleware/errorHandler.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { apartmentsRouter, myApartmentRouter } from './modules/apartments/apartments.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { citiesRouter } from './modules/cities/cities.routes.js';
import { siteRouter } from './modules/site/site.routes.js';
import { swapsRouter } from './modules/swaps/swaps.routes.js';
import './utils/validation.js';

/** בניית אפליקציית Express (בלי להאזין לפורט, כדי שאפשר יהיה להשתמש בה גם בבדיקות) */
export function createApp() {
  const app = express();

  // בענן (Render) השרת יושב מאחורי Proxy
  app.set('trust proxy', 1);

  // כותרות אבטחה. CSP כבוי כי השרת מחזיר JSON, ו-Swagger UI צריך סקריפטים משלו
  app.use(helmet({ contentSecurityPolicy: false }));

  const origins = corsOrigins();
  app.use(
    cors({
      origin: origins === '*' ? true : origins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  app.use(express.json({ limit: '100kb' }));

  app.get('/', (_req, res) => {
    res.json({ name: 'Apartment Swap API', docs: '/api-docs', health: '/api/health' });
  });

  app.use(docsRouter());

  app.use('/api', siteRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/cities', citiesRouter);
  app.use('/api/apartments', apartmentsRouter);
  app.use('/api/my', myApartmentRouter);
  app.use('/api/swaps', swapsRouter);
  app.use('/api/admin', adminRouter);

  app.use(routeNotFound);
  app.use(errorHandler);

  return app;
}
