import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';

/**
 * קובץ התיעוד נמצא ב-docs/openapi.json בתיקיית הפרויקט.
 * הנתיב מחושב יחסית לקובץ הזה, ולכן עובד גם מ-src (פיתוח) וגם מ-dist (ענן).
 */
const here = path.dirname(fileURLToPath(import.meta.url));
export const OPENAPI_PATH = path.resolve(here, '../../docs/openapi.json');

export function loadOpenApi(): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(OPENAPI_PATH, 'utf8')) as Record<string, unknown>;
}

export function docsRouter(): Router {
  const spec = loadOpenApi();
  const router = Router();

  router.get('/openapi.json', (_req, res) => {
    res.json(spec);
  });

  router.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      customSiteTitle: 'Apartment Swap API',
      swaggerOptions: { persistAuthorization: true },
    }),
  );
  return router;
}
