import { execSync } from 'node:child_process';
import fs from 'node:fs';
import { afterAll, describe, expect, it } from 'vitest';
import { OPENAPI_PATH } from '../src/docs/swagger.js';
import { api, prisma } from './helpers.js';

afterAll(() => prisma.$disconnect());

interface Operation {
  summary?: string;
  responses?: Record<string, unknown>;
  security?: unknown[];
}
const spec = JSON.parse(fs.readFileSync(OPENAPI_PATH, 'utf8')) as {
  openapi: string;
  paths: Record<string, Record<string, Operation>>;
  components: { securitySchemes: Record<string, { type: string; scheme: string }> };
};
const operations = Object.entries(spec.paths).flatMap(([path, methods]) =>
  Object.entries(methods).map(([method, op]) => ({ method, path, op })),
);
const toUrl = (path: string) => path.replace(/\{[^}]+\}/g, '999999');

describe('health', () => {
  it('GET /api/health reports server and database ok', async () => {
    const res = await api().get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'ok' });
  });

  it('GET /api/site-info returns the admin contact and the terms', async () => {
    const res = await api().get('/api/site-info');
    expect(res.status).toBe(200);
    expect(res.body.adminContactEmail).toEqual(expect.any(String));
    expect(res.body.termsText).toContain('תקנון');
  });

  it('unknown routes return a clear 404', async () => {
    const res = await api().get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
  });
});

describe('Swagger / OpenAPI', () => {
  it('serves Swagger UI at /api-docs', async () => {
    const res = await api().get('/api-docs/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger');
  });

  it('serves the OpenAPI document at /openapi.json', async () => {
    const res = await api().get('/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
  });

  it('defines an HTTP Bearer JWT security scheme (the Authorize button)', () => {
    expect(spec.components.securitySchemes.bearerAuth).toMatchObject({ type: 'http', scheme: 'bearer' });
  });

  it('documents 35 operations, each with a summary and responses', () => {
    expect(operations).toHaveLength(35);
    for (const { method, path, op } of operations) {
      expect(op.summary, `${method} ${path}`).toBeTruthy();
      expect(Object.keys(op.responses ?? {}).length, `${method} ${path}`).toBeGreaterThan(0);
    }
  });

  it('every documented operation exists in the server', async () => {
    for (const { method, path } of operations) {
      const res = await (api() as unknown as Record<string, (url: string) => Promise<{ status: number; body: { error?: { code?: string } } }>>)[
        method
      ]!(toUrl(path));
      expect(res.body?.error?.code, `${method.toUpperCase()} ${path}`).not.toBe('ROUTE_NOT_FOUND');
    }
  });

  it('every operation that requires a token returns 401 without one', async () => {
    const secured = operations.filter(({ op }) =>
      (op.security ?? []).some((s) => Object.keys(s as object).includes('bearerAuth')) &&
      !(op.security ?? []).some((s) => Object.keys(s as object).length === 0),
    );
    expect(secured.length).toBeGreaterThan(20);
    for (const { method, path } of secured) {
      const res = await (api() as unknown as Record<string, (url: string) => Promise<{ status: number }>>)[method]!(toUrl(path));
      expect(res.status, `${method.toUpperCase()} ${path}`).toBe(401);
    }
  });
});

describe('Prisma', () => {
  it('schema is valid', () => {
    const out = execSync('npx prisma validate', { encoding: 'utf8', env: process.env });
    expect(out).toMatch(/valid/i);
  });

  it('database matches the migrations (no pending migrations)', () => {
    const out = execSync('npx prisma migrate status', { encoding: 'utf8', env: process.env });
    expect(out).toMatch(/up to date/i);
  });
});
