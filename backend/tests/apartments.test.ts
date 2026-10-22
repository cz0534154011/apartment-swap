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
  validApartmentBody,
} from './helpers.js';
import { ymdToDate } from '../src/utils/dates.js';

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('my apartment (create / read / update / status)', () => {
  it('creates the apartment of the logged-in user', async () => {
    const city = await createCity();
    const { token, user } = await createUser();
    const res = await api().post('/api/my/apartment').set(bearer(token)).send(validApartmentBody(city.id));
    expect(res.status).toBe(201);
    expect(res.body.apartment).toMatchObject({
      title: 'דירת 4 חדרים ליד בית הכנסת',
      city: { id: city.id, name: 'ירושלים' },
      rooms: 4.5,
      beds: 8,
      status: 'ACTIVE',
      isBlocked: false,
    });
    const stored = await prisma.apartment.findUniqueOrThrow({ where: { ownerId: user.id } });
    expect(stored.id).toBe(res.body.apartment.id);
  });

  it('allows only one apartment per user', async () => {
    const city = await createCity();
    const { token } = await createUser();
    await api().post('/api/my/apartment').set(bearer(token)).send(validApartmentBody(city.id));
    const res = await api().post('/api/my/apartment').set(bearer(token)).send(validApartmentBody(city.id));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('APARTMENT_EXISTS');
  });

  it('validates the apartment fields', async () => {
    const city = await createCity();
    const { token } = await createUser();
    const res = await api()
      .post('/api/my/apartment')
      .set(bearer(token))
      .send({ ...validApartmentBody(city.id), title: 'קצר', rooms: 3.3, beds: 0, floor: 99, description: 'קצר' });
    expect(res.status).toBe(400);
    const fields = res.body.error.details.map((d: { field: string }) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['title', 'rooms', 'beds', 'floor', 'description']));
  });

  it('rejects an inactive or unknown city', async () => {
    const inactive = await createCity('צפת', false);
    const { token } = await createUser();
    let res = await api().post('/api/my/apartment').set(bearer(token)).send(validApartmentBody(inactive.id));
    expect(res.status).toBe(400);
    res = await api().post('/api/my/apartment').set(bearer(token)).send(validApartmentBody(9999));
    expect(res.status).toBe(400);
  });

  it('admins cannot create an apartment (403)', async () => {
    const city = await createCity();
    const { token } = await createAdmin();
    const res = await api().post('/api/my/apartment').set(bearer(token)).send(validApartmentBody(city.id));
    expect(res.status).toBe(403);
  });

  it('returns 404 NO_APARTMENT before publishing, then the apartment', async () => {
    const city = await createCity();
    const { token } = await createUser();
    expect((await api().get('/api/my/apartment').set(bearer(token))).body.error.code).toBe('NO_APARTMENT');
    await api().post('/api/my/apartment').set(bearer(token)).send(validApartmentBody(city.id));
    const res = await api().get('/api/my/apartment').set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.apartment.beds).toBe(8);
  });

  it('updates only the own apartment (identified by token)', async () => {
    const city = await createCity();
    const other = await userWithApartment(city.id, { title: 'הדירה של מישהו אחר' });
    const me = await userWithApartment(city.id);
    const res = await api()
      .put('/api/my/apartment')
      .set(bearer(me.token))
      .send({ ...validApartmentBody(city.id), title: 'כותרת מעודכנת לדירה', beds: 10 });
    expect(res.status).toBe(200);
    expect(res.body.apartment).toMatchObject({ id: me.apartment.id, title: 'כותרת מעודכנת לדירה', beds: 10 });
    const untouched = await prisma.apartment.findUniqueOrThrow({ where: { id: other.apartment.id } });
    expect(untouched.title).toBe('הדירה של מישהו אחר');
  });

  it('hides the apartment: gone from search and from public view, still visible to owner and admin', async () => {
    const city = await createCity();
    const owner = await userWithApartment(city.id);
    const { token: adminToken } = await createAdmin();

    const res = await api().patch('/api/my/apartment/status').set(bearer(owner.token)).send({ status: 'HIDDEN' });
    expect(res.status).toBe(200);
    expect(res.body.apartment.status).toBe('HIDDEN');

    expect((await api().get('/api/apartments')).body.total).toBe(0);
    expect((await api().get(`/api/apartments/${owner.apartment.id}`)).status).toBe(404);
    expect((await api().get(`/api/apartments/${owner.apartment.id}`).set(bearer(owner.token))).status).toBe(200);
    expect((await api().get(`/api/apartments/${owner.apartment.id}`).set(bearer(adminToken))).status).toBe(200);
  });

  it('public apartment view does not include owner or status details', async () => {
    const city = await createCity();
    const owner = await userWithApartment(city.id);
    const res = await api().get(`/api/apartments/${owner.apartment.id}`);
    expect(res.status).toBe(200);
    expect(res.body.apartment.status).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain(owner.user.email);
  });
});

describe('GET /api/apartments (search, filter, sort, pagination)', () => {
  async function seedSearchData() {
    const jerusalem = await createCity('ירושלים');
    const safed = await createCity('צפת');
    const a = await userWithApartment(jerusalem.id, {
      title: 'דירה גדולה ברמות',
      neighborhood: 'רמות',
      beds: 9,
      rooms: 5,
      hasPlata: true,
      hasEruv: true,
    });
    const b = await userWithApartment(jerusalem.id, { title: 'דירה קטנה בגאולה', neighborhood: 'גאולה', beds: 3, rooms: 2 });
    const c = await userWithApartment(safed.id, { title: 'דירת נופש בצפת', beds: 6, rooms: 3.5, hasPlata: true });
    return { jerusalem, safed, a, b, c };
  }

  it('filters by city, minimum beds, rooms and amenities', async () => {
    const { jerusalem, a, c } = await seedSearchData();
    let res = await api().get(`/api/apartments?cityId=${jerusalem.id}`);
    expect(res.body.total).toBe(2);

    res = await api().get('/api/apartments?minBeds=6');
    expect(res.body.items.map((i: { id: number }) => i.id).sort()).toEqual([a.apartment.id, c.apartment.id].sort());

    res = await api().get('/api/apartments?minRooms=4');
    expect(res.body.items.map((i: { id: number }) => i.id)).toEqual([a.apartment.id]);

    res = await api().get('/api/apartments?hasPlata=true&hasEruv=true');
    expect(res.body.items.map((i: { id: number }) => i.id)).toEqual([a.apartment.id]);

    // false פירושו "בלי סינון", לא "חייב שלא יהיה"
    res = await api().get('/api/apartments?hasPlata=false');
    expect(res.body.total).toBe(3);
  });

  it('searches free text in title, neighborhood and description', async () => {
    const { b } = await seedSearchData();
    const res = await api().get(`/api/apartments?q=${encodeURIComponent('גאולה')}`);
    expect(res.body.items.map((i: { id: number }) => i.id)).toEqual([b.apartment.id]);
  });

  it('sorts by beds and paginates', async () => {
    await seedSearchData();
    const res = await api().get('/api/apartments?sort=beds&pageSize=2&page=1');
    expect(res.body).toMatchObject({ page: 1, pageSize: 2, total: 3, totalPages: 2 });
    expect(res.body.items.map((i: { beds: number }) => i.beds)).toEqual([9, 6]);
    const page2 = await api().get('/api/apartments?sort=beds&pageSize=2&page=2');
    expect(page2.body.items.map((i: { beds: number }) => i.beds)).toEqual([3]);
  });

  it('excludes the logged-in user own apartment and blocked apartments', async () => {
    const { a, b } = await seedSearchData();
    await prisma.apartment.update({ where: { id: b.apartment.id }, data: { isBlocked: true, blockReason: 'בדיקה' } });
    const res = await api().get('/api/apartments').set(bearer(a.token));
    expect(res.body.total).toBe(1);
  });

  it('date filter hides apartments with an approved swap or a manual block in the range', async () => {
    const { a, b, c } = await seedSearchData();
    await insertSwap({ senderApartmentId: a.apartment.id, receiverApartmentId: b.apartment.id, start: day(10), end: day(12), status: 'APPROVED' });
    await prisma.blockedDate.create({ data: { apartmentId: c.apartment.id, startDate: ymdToDate(day(12)), endDate: ymdToDate(day(13)) } });
    // הצעה ממתינה לא חוסמת
    await insertSwap({ senderApartmentId: c.apartment.id, receiverApartmentId: a.apartment.id, start: day(20), end: day(21) });

    let res = await api().get(`/api/apartments?from=${day(12)}&to=${day(12)}`);
    expect(res.body.total).toBe(0);

    res = await api().get(`/api/apartments?from=${day(14)}&to=${day(16)}`);
    expect(res.body.total).toBe(3);

    res = await api().get(`/api/apartments?from=${day(20)}&to=${day(21)}`);
    expect(res.body.total).toBe(3);
  });

  it('validates the date range', async () => {
    await seedSearchData();
    expect((await api().get(`/api/apartments?from=${day(1)}`)).status).toBe(400);
    expect((await api().get(`/api/apartments?from=${day(-1)}&to=${day(1)}`)).status).toBe(400);
    expect((await api().get(`/api/apartments?from=${day(5)}&to=${day(3)}`)).status).toBe(400);
    expect((await api().get(`/api/apartments?from=${day(1)}&to=${day(15)}`)).status).toBe(400);
    expect((await api().get(`/api/apartments?from=${day(1)}&to=${day(14)}`)).status).toBe(200);
    expect((await api().get('/api/apartments?from=2026-13-45&to=2026-13-46')).status).toBe(400);
    expect((await api().get('/api/apartments?sort=price')).status).toBe(400);
  });
});

describe('GET /api/apartments/:id/calendar', () => {
  it('returns swap and block ranges; pending offers only for the owner', async () => {
    const city = await createCity();
    const a = await userWithApartment(city.id);
    const b = await userWithApartment(city.id);
    await insertSwap({ senderApartmentId: a.apartment.id, receiverApartmentId: b.apartment.id, start: day(10), end: day(12), status: 'APPROVED' });
    await insertSwap({ senderApartmentId: b.apartment.id, receiverApartmentId: a.apartment.id, start: day(30), end: day(31) });
    await prisma.blockedDate.create({ data: { apartmentId: a.apartment.id, startDate: ymdToDate(day(3)), endDate: ymdToDate(day(4)) } });
    // מחוץ לחלון של 6 חודשים
    await prisma.blockedDate.create({ data: { apartmentId: a.apartment.id, startDate: ymdToDate(day(400)), endDate: ymdToDate(day(401)) } });

    const guest = await api().get(`/api/apartments/${a.apartment.id}/calendar`);
    expect(guest.status).toBe(200);
    expect(guest.body.from).toBe(day(0));
    expect(guest.body.busyRanges).toEqual([
      { startDate: day(3), endDate: day(4), reason: 'BLOCKED' },
      { startDate: day(10), endDate: day(12), reason: 'SWAP' },
    ]);
    expect(guest.body.pendingRanges).toBeUndefined();

    const owner = await api().get(`/api/apartments/${a.apartment.id}/calendar`).set(bearer(a.token));
    expect(owner.body.pendingRanges).toEqual([
      expect.objectContaining({ startDate: day(30), endDate: day(31), direction: 'RECEIVED' }),
    ]);
  });

  it('validates the window and hides calendars of hidden apartments', async () => {
    const city = await createCity();
    const a = await userWithApartment(city.id, { status: 'HIDDEN' });
    expect((await api().get(`/api/apartments/${a.apartment.id}/calendar`)).status).toBe(404);

    const b = await userWithApartment(city.id);
    expect((await api().get(`/api/apartments/${b.apartment.id}/calendar?from=${day(-1)}`)).status).toBe(400);
    expect((await api().get(`/api/apartments/${b.apartment.id}/calendar?to=${day(400)}`)).status).toBe(400);
    expect((await api().get(`/api/apartments/${b.apartment.id}/calendar?from=${day(5)}&to=${day(6)}`)).status).toBe(200);
  });
});

describe('manual blocked dates', () => {
  it('adds, lists and deletes blocks of the own apartment', async () => {
    const city = await createCity();
    const me = await userWithApartment(city.id);
    const add = await api()
      .post('/api/my/apartment/blocked-dates')
      .set(bearer(me.token))
      .send({ startDate: day(5), endDate: day(6), note: 'אורחים' });
    expect(add.status).toBe(201);
    expect(add.body.blockedDate).toMatchObject({ startDate: day(5), endDate: day(6), note: 'אורחים' });

    const list = await api().get('/api/my/apartment/blocked-dates').set(bearer(me.token));
    expect(list.body).toHaveLength(1);

    const del = await api().delete(`/api/my/apartment/blocked-dates/${add.body.blockedDate.id}`).set(bearer(me.token));
    expect(del.status).toBe(204);
    expect(await prisma.blockedDate.count()).toBe(0);
  });

  it('rejects overlapping blocks, past dates and ranges longer than 14 days', async () => {
    const city = await createCity();
    const me = await userWithApartment(city.id);
    const post = (startDate: string, endDate: string) =>
      api().post('/api/my/apartment/blocked-dates').set(bearer(me.token)).send({ startDate, endDate });

    expect((await post(day(5), day(7))).status).toBe(201);
    const overlap = await post(day(7), day(8));
    expect(overlap.status).toBe(409);
    expect(overlap.body.error.code).toBe('DATES_UNAVAILABLE');
    expect((await post(day(-2), day(1))).status).toBe(400);
    expect((await post(day(20), day(34))).status).toBe(400);
  });

  it('cannot delete a block of another user (404)', async () => {
    const city = await createCity();
    const a = await userWithApartment(city.id);
    const b = await userWithApartment(city.id);
    const block = await prisma.blockedDate.create({
      data: { apartmentId: a.apartment.id, startDate: ymdToDate(day(3)), endDate: ymdToDate(day(4)) },
    });
    const res = await api().delete(`/api/my/apartment/blocked-dates/${block.id}`).set(bearer(b.token));
    expect(res.status).toBe(404);
  });

  it('auto-rejects pending offers that overlap a new block', async () => {
    const city = await createCity();
    const a = await userWithApartment(city.id);
    const b = await userWithApartment(city.id);
    const offer = await insertSwap({ senderApartmentId: b.apartment.id, receiverApartmentId: a.apartment.id, start: day(10), end: day(11) });
    const res = await api()
      .post('/api/my/apartment/blocked-dates')
      .set(bearer(a.token))
      .send({ startDate: day(11), endDate: day(12) });
    expect(res.status).toBe(201);
    expect(res.body.autoRejectedOffers).toBe(1);
    expect((await prisma.swapOffer.findUniqueOrThrow({ where: { id: offer.id } })).status).toBe('AUTO_REJECTED');
  });
});
