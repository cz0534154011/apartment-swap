import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { api, bearer, createAdmin, createApartment, createCity, createUser, prisma, resetDb } from './helpers.js';

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('cities', () => {
  it('lists only active cities to the public', async () => {
    await createCity('ירושלים');
    await createCity('צפת', false);
    const res = await api().get('/api/cities');
    expect(res.status).toBe(200);
    expect(res.body.map((c: { name: string }) => c.name)).toEqual(['ירושלים']);
  });

  it('lets an admin include inactive cities, but not a regular user', async () => {
    await createCity('ירושלים');
    await createCity('צפת', false);
    const { token: adminToken } = await createAdmin();
    const { token: userToken } = await createUser();

    const asAdmin = await api().get('/api/cities?includeInactive=true').set(bearer(adminToken));
    expect(asAdmin.body).toHaveLength(2);

    const asUser = await api().get('/api/cities?includeInactive=true').set(bearer(userToken));
    expect(asUser.body).toHaveLength(1);
  });

  it('only admins can create cities (401 guest, 403 user, 201 admin)', async () => {
    const { token: userToken } = await createUser();
    const { token: adminToken } = await createAdmin();

    expect((await api().post('/api/cities').send({ name: 'אלעד' })).status).toBe(401);
    expect((await api().post('/api/cities').set(bearer(userToken)).send({ name: 'אלעד' })).status).toBe(403);

    const res = await api().post('/api/cities').set(bearer(adminToken)).send({ name: '  אלעד ' });
    expect(res.status).toBe(201);
    expect(res.body.city).toMatchObject({ name: 'אלעד', isActive: true });
  });

  it('rejects a duplicate city name with 409', async () => {
    await createCity('אלעד');
    const { token } = await createAdmin();
    const res = await api().post('/api/cities').set(bearer(token)).send({ name: 'אלעד' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CITY_EXISTS');
  });

  it('renames and deactivates a city', async () => {
    const city = await createCity('בני ברק');
    const { token } = await createAdmin();
    const res = await api()
      .patch(`/api/cities/${city.id}`)
      .set(bearer(token))
      .send({ name: 'בני-ברק', isActive: false });
    expect(res.status).toBe(200);
    expect(res.body.city).toMatchObject({ name: 'בני-ברק', isActive: false });
  });

  it('refuses to delete a city in use, deletes an unused one', async () => {
    const used = await createCity('ירושלים');
    const unused = await createCity('טבריה');
    const { user } = await createUser();
    await createApartment(user.id, used.id);
    const { token } = await createAdmin();

    const inUse = await api().delete(`/api/cities/${used.id}`).set(bearer(token));
    expect(inUse.status).toBe(409);
    expect(inUse.body.error.code).toBe('CITY_IN_USE');

    const ok = await api().delete(`/api/cities/${unused.id}`).set(bearer(token));
    expect(ok.status).toBe(204);
    expect(await prisma.city.count()).toBe(1);
  });

  it('returns 404 for an unknown city', async () => {
    const { token } = await createAdmin();
    const res = await api().patch('/api/cities/9999').set(bearer(token)).send({ isActive: false });
    expect(res.status).toBe(404);
  });
});
