import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  api,
  bearer,
  createAdmin,
  createCity,
  createUser,
  day,
  insertSwap,
  prisma,
  resetDb,
  userWithApartment,
} from './helpers.js';

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('admin access control', () => {
  it('guests get 401 and regular users get 403 on every admin endpoint', async () => {
    const { token } = await createUser();
    const endpoints: [string, string][] = [
      ['get', '/api/admin/apartments'],
      ['post', '/api/admin/apartments/1/block'],
      ['post', '/api/admin/apartments/1/unblock'],
      ['get', '/api/admin/users'],
      ['get', '/api/admin/swaps'],
    ];
    for (const [method, url] of endpoints) {
      const guest = method === 'get' ? await api().get(url) : await api().post(url);
      expect(guest.status, `${method} ${url} as guest`).toBe(401);
      const asUser = method === 'get' ? await api().get(url).set(bearer(token)) : await api().post(url).set(bearer(token));
      expect(asUser.status, `${method} ${url} as user`).toBe(403);
    }
  });
});

describe('admin apartments', () => {
  it('lists all apartments including hidden and blocked, with owner details', async () => {
    const city = await createCity();
    await userWithApartment(city.id);
    await userWithApartment(city.id, { status: 'HIDDEN' });
    await userWithApartment(city.id, { isBlocked: true, blockReason: 'תוכן לא מתאים' });
    const { token } = await createAdmin();

    const res = await api().get('/api/admin/apartments').set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.items[0].owner).toEqual(expect.objectContaining({ email: expect.any(String) }));

    expect((await api().get('/api/admin/apartments?isBlocked=true').set(bearer(token))).body.total).toBe(1);
    expect((await api().get('/api/admin/apartments?status=HIDDEN').set(bearer(token))).body.total).toBe(1);
  });

  it('searches by partial owner email and by phone regardless of dashes and spaces', async () => {
    const city = await createCity();
    const target = await userWithApartment(city.id, {}, { email: 'yossi.cohen@test.com', phone: '0527654321' });
    await userWithApartment(city.id, {}, { email: 'other@test.com', phone: '0531112233' });
    const { token } = await createAdmin();

    let res = await api().get('/api/admin/apartments?ownerEmail=COHEN').set(bearer(token));
    expect(res.body.items.map((i: { id: number }) => i.id)).toEqual([target.apartment.id]);

    res = await api().get(`/api/admin/apartments?ownerPhone=${encodeURIComponent('052-765 4321')}`).set(bearer(token));
    expect(res.body.items.map((i: { id: number }) => i.id)).toEqual([target.apartment.id]);

    res = await api().get('/api/admin/apartments?ownerPhone=4321').set(bearer(token));
    expect(res.body.total).toBe(1);
  });

  it('blocking: hides the apartment, auto-rejects pending offers, keeps approved swaps', async () => {
    const city = await createCity();
    const bad = await userWithApartment(city.id);
    const other = await userWithApartment(city.id);
    const pendingIn = await insertSwap({ senderApartmentId: other.apartment.id, receiverApartmentId: bad.apartment.id, start: day(10), end: day(11) });
    const pendingOut = await insertSwap({ senderApartmentId: bad.apartment.id, receiverApartmentId: other.apartment.id, start: day(20), end: day(21) });
    const approved = await insertSwap({ senderApartmentId: bad.apartment.id, receiverApartmentId: other.apartment.id, start: day(30), end: day(31), status: 'APPROVED' });
    const { token } = await createAdmin();

    const res = await api()
      .post(`/api/admin/apartments/${bad.apartment.id}/block`)
      .set(bearer(token))
      .send({ reason: 'פרטים לא נכונים' });
    expect(res.status).toBe(200);
    expect(res.body.apartment).toMatchObject({ isBlocked: true, blockReason: 'פרטים לא נכונים' });
    expect(res.body.autoRejectedOffers).toBe(2);

    const status = async (id: number) => (await prisma.swapOffer.findUniqueOrThrow({ where: { id } })).status;
    expect(await status(pendingIn.id)).toBe('AUTO_REJECTED');
    expect(await status(pendingOut.id)).toBe('AUTO_REJECTED');
    expect(await status(approved.id)).toBe('APPROVED');

    // לא בחיפוש, לא בצפייה ציבורית
    expect((await api().get('/api/apartments')).body.items.map((i: { id: number }) => i.id)).not.toContain(bad.apartment.id);
    expect((await api().get(`/api/apartments/${bad.apartment.id}`)).status).toBe(404);

    // בעל הדירה לא יכול לשחרר ולא לשלוח הצעות, אבל רואה את הסיבה
    const statusChange = await api().patch('/api/my/apartment/status').set(bearer(bad.token)).send({ status: 'ACTIVE' });
    expect(statusChange.status).toBe(403);
    const mine = await api().get('/api/my/apartment').set(bearer(bad.token));
    expect(mine.body.apartment.blockReason).toBe('פרטים לא נכונים');
    const offer = await api()
      .post('/api/swaps')
      .set(bearer(bad.token))
      .send({ receiverApartmentId: other.apartment.id, startDate: day(40), endDate: day(41) });
    expect(offer.status).toBe(403);

    // חסימה כפולה
    expect((await api().post(`/api/admin/apartments/${bad.apartment.id}/block`).set(bearer(token)).send({ reason: 'שוב' })).status).toBe(409);
  });

  it('requires a block reason', async () => {
    const city = await createCity();
    const a = await userWithApartment(city.id);
    const { token } = await createAdmin();
    const res = await api().post(`/api/admin/apartments/${a.apartment.id}/block`).set(bearer(token)).send({});
    expect(res.status).toBe(400);
  });

  it('unblocking restores the owner chosen status', async () => {
    const city = await createCity();
    const a = await userWithApartment(city.id, { status: 'HIDDEN', isBlocked: true, blockReason: 'בדיקה' });
    const { token } = await createAdmin();
    const res = await api().post(`/api/admin/apartments/${a.apartment.id}/unblock`).set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.apartment).toMatchObject({ isBlocked: false, blockReason: null, status: 'HIDDEN' });
    expect((await api().post(`/api/admin/apartments/${a.apartment.id}/unblock`).set(bearer(token))).status).toBe(409);
  });
});

describe('admin users and swaps', () => {
  it('searches users by name, email and phone; never returns password hashes', async () => {
    const city = await createCity();
    await userWithApartment(city.id, {}, { fullName: 'משפחת שטרן', email: 'stern@test.com', phone: '0581234567' });
    await createUser({ fullName: 'משפחת וייס', email: 'weiss@test.com', phone: '0589876543' });
    const { token } = await createAdmin();

    let res = await api().get(`/api/admin/users?name=${encodeURIComponent('שטרן')}`).set(bearer(token));
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].apartment).toEqual(expect.objectContaining({ status: 'ACTIVE' }));

    res = await api().get('/api/admin/users?email=WEISS').set(bearer(token));
    expect(res.body.items[0].apartment).toBeNull();

    res = await api().get('/api/admin/users?phone=058-123').set(bearer(token));
    expect(res.body.total).toBe(1);

    const all = await api().get('/api/admin/users').set(bearer(token));
    expect(JSON.stringify(all.body)).not.toContain('passwordHash');
  });

  it('lists all swaps with a filter by apartment and status', async () => {
    const city = await createCity();
    const a = await userWithApartment(city.id);
    const b = await userWithApartment(city.id);
    const c = await userWithApartment(city.id);
    await insertSwap({ senderApartmentId: a.apartment.id, receiverApartmentId: b.apartment.id, start: day(10), end: day(11) });
    await insertSwap({ senderApartmentId: b.apartment.id, receiverApartmentId: c.apartment.id, start: day(20), end: day(21), status: 'APPROVED' });
    const { token } = await createAdmin();

    expect((await api().get('/api/admin/swaps').set(bearer(token))).body.total).toBe(2);
    expect((await api().get(`/api/admin/swaps?apartmentId=${a.apartment.id}`).set(bearer(token))).body.total).toBe(1);
    const approved = await api().get('/api/admin/swaps?status=APPROVED').set(bearer(token));
    expect(approved.body.total).toBe(1);
    expect(approved.body.items[0].senderApartment.owner).toEqual(expect.objectContaining({ fullName: expect.any(String) }));
  });
});
