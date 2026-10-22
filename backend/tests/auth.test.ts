import jwt from 'jsonwebtoken';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { api, bearer, createApartment, createCity, createUser, prisma, resetDb } from './helpers.js';

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

const validRegister = {
  fullName: 'משפחת בדיקה',
  email: 'Test.User@Example.com',
  password: 'Secret123',
  phone: '050-123-4567',
  acceptTerms: true,
};

describe('POST /api/auth/register', () => {
  it('registers a user, returns a token, never returns the password hash', async () => {
    const res = await api().post('/api/auth/register').send(validRegister);
    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.expiresIn).toBe(24 * 60 * 60);
    expect(res.body.user).toMatchObject({
      fullName: 'משפחת בדיקה',
      email: 'test.user@example.com',
      phone: '0501234567',
      role: 'USER',
    });
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|Secret123/);

    const stored = await prisma.user.findUniqueOrThrow({ where: { email: 'test.user@example.com' } });
    expect(stored.passwordHash).not.toBe('Secret123');
    expect(stored.termsAcceptedAt).toBeInstanceOf(Date);
  });

  it('ignores an attempt to register as admin', async () => {
    const res = await api().post('/api/auth/register').send({ ...validRegister, role: 'ADMIN' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('USER');
  });

  it('rejects a duplicate email with 409', async () => {
    await api().post('/api/auth/register').send(validRegister);
    const res = await api().post('/api/auth/register').send(validRegister);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('requires accepting the terms', async () => {
    const res = await api().post('/api/auth/register').send({ ...validRegister, acceptTerms: false });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'acceptTerms' })]),
    );
  });

  it('validates fields and returns Hebrew messages per field', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ fullName: 'א', email: 'not-an-email', password: 'short', phone: '12', acceptTerms: true });
    expect(res.status).toBe(400);
    const fields = res.body.error.details.map((d: { field: string }) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['fullName', 'email', 'password', 'phone']));
    expect(res.body.error.message).toBe('הנתונים שנשלחו אינם תקינים');
  });

  it('rejects a password without digits', async () => {
    const res = await api().post('/api/auth/register').send({ ...validRegister, password: 'onlyletters' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await api().post('/api/auth/register').set('Content-Type', 'application/json').send('{bad json');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials (email is case-insensitive)', async () => {
    await createUser({ email: 'login@test.com', password: 'Passw0rd!' });
    const res = await api().post('/api/auth/login').send({ email: 'LOGIN@test.com', password: 'Passw0rd!' });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe('login@test.com');
  });

  it('returns 401 for a wrong password', async () => {
    await createUser({ email: 'login@test.com', password: 'Passw0rd!' });
    const res = await api().post('/api/auth/login').send({ email: 'login@test.com', password: 'Wrong1234' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns the same 401 for an unknown email', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'nobody@test.com', password: 'Passw0rd!' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('GET /api/auth/me and token handling', () => {
  it('returns 401 AUTH_REQUIRED without a token', async () => {
    const res = await api().get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_REQUIRED');
  });

  it('returns 401 INVALID_TOKEN for a garbage token', async () => {
    const res = await api().get('/api/auth/me').set(bearer('not-a-real-token'));
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('returns 401 INVALID_TOKEN for a token signed with another secret', async () => {
    const { user } = await createUser();
    const forged = jwt.sign({ role: 'ADMIN' }, 'some-other-secret-some-other-secret', { subject: String(user.id) });
    const res = await api().get('/api/auth/me').set(bearer(forged));
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('returns 401 TOKEN_EXPIRED for an expired token', async () => {
    const { user } = await createUser();
    const past = Math.floor(Date.now() / 1000) - 3600;
    const expired = jwt.sign({ role: 'USER', iat: past - 60, exp: past }, process.env.JWT_SECRET!, {
      subject: String(user.id),
    });
    const res = await api().get('/api/auth/me').set(bearer(expired));
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  it('returns 401 for a malformed Authorization header', async () => {
    const res = await api().get('/api/auth/me').set('Authorization', 'Token abc');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('returns the current user and whether they have an apartment', async () => {
    const city = await createCity();
    const { user, token } = await createUser();
    let res = await api().get('/api/auth/me').set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ user: { id: user.id }, hasApartment: false });

    await createApartment(user.id, city.id);
    res = await api().get('/api/auth/me').set(bearer(token));
    expect(res.body.hasApartment).toBe(true);
  });

  it('uses the role from the database, not from the token', async () => {
    const { user } = await createUser();
    const fakeAdmin = jwt.sign({ role: 'ADMIN' }, process.env.JWT_SECRET!, { subject: String(user.id) });
    const res = await api().get('/api/admin/users').set(bearer(fakeAdmin));
    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/auth/me', () => {
  it('updates name and normalizes the phone', async () => {
    const { token } = await createUser();
    const res = await api()
      .patch('/api/auth/me')
      .set(bearer(token))
      .send({ fullName: 'שם חדש', phone: '054 111-2222' });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ fullName: 'שם חדש', phone: '0541112222' });
  });

  it('removes the phone when null is sent', async () => {
    const { token } = await createUser();
    const res = await api().patch('/api/auth/me').set(bearer(token)).send({ phone: null });
    expect(res.status).toBe(200);
    expect(res.body.user.phone).toBeNull();
  });

  it('requires at least one field', async () => {
    const { token } = await createUser();
    const res = await api().patch('/api/auth/me').set(bearer(token)).send({});
    expect(res.status).toBe(400);
  });

  it('cannot change the email', async () => {
    const { token, user } = await createUser();
    const res = await api().patch('/api/auth/me').set(bearer(token)).send({ fullName: 'שם', email: 'x@y.com' });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(user.email);
  });
});
