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

async function threeFamilies() {
  const city = await createCity();
  const a = await userWithApartment(city.id, {}, { fullName: 'משפחה א', email: 'a@test.com', phone: '0501111111' });
  const b = await userWithApartment(city.id, {}, { fullName: 'משפחה ב', email: 'b@test.com', phone: '0502222222' });
  const c = await userWithApartment(city.id, {}, { fullName: 'משפחה ג', email: 'c@test.com', phone: '0503333333' });
  return { city, a, b, c };
}

const send = (token: string, receiverApartmentId: number, startDate: string, endDate: string, message?: string) =>
  api().post('/api/swaps').set(bearer(token)).send({ receiverApartmentId, startDate, endDate, message });

describe('POST /api/swaps (sending an offer)', () => {
  it('creates a pending offer; the sender apartment is taken from the token', async () => {
    const { a, b } = await threeFamilies();
    const res = await send(a.token, b.apartment.id, day(10), day(12), 'נשמח להחליף');
    expect(res.status).toBe(201);
    expect(res.body.swap).toMatchObject({
      status: 'PENDING',
      startDate: day(10),
      endDate: day(12),
      direction: 'SENT',
      message: 'נשמח להחליף',
      senderApartment: { id: a.apartment.id },
      receiverApartment: { id: b.apartment.id },
      allowedActions: { canWithdraw: true, canApprove: false },
    });
    // השולח רואה את פרטי הקשר של הצד השני
    expect(res.body.swap.otherParty).toEqual({ fullName: 'משפחה ב', email: 'b@test.com', phone: '0502222222' });
  });

  it('requires an own active apartment (403)', async () => {
    const { b, city } = await threeFamilies();
    const { token } = await createUser();
    let res = await send(token, b.apartment.id, day(10), day(12));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('NO_APARTMENT');

    const hidden = await userWithApartment(city.id, { status: 'HIDDEN' });
    res = await send(hidden.token, b.apartment.id, day(10), day(12));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('APARTMENT_HIDDEN');

    const blocked = await userWithApartment(city.id, { isBlocked: true, blockReason: 'בדיקה' });
    res = await send(blocked.token, b.apartment.id, day(10), day(12));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('APARTMENT_BLOCKED');
  });

  it('rejects offers to the own apartment and to hidden/unknown apartments', async () => {
    const { a, city } = await threeFamilies();
    expect((await send(a.token, a.apartment.id, day(10), day(12))).body.error.code).toBe('CANNOT_OFFER_OWN_APARTMENT');
    const hidden = await userWithApartment(city.id, { status: 'HIDDEN' });
    expect((await send(a.token, hidden.apartment.id, day(10), day(12))).status).toBe(404);
    expect((await send(a.token, 9999, day(10), day(12))).status).toBe(404);
  });

  it('validates dates (past, over 14 days, over 6 months, end before start)', async () => {
    const { a, b } = await threeFamilies();
    expect((await send(a.token, b.apartment.id, day(-1), day(1))).status).toBe(400);
    expect((await send(a.token, b.apartment.id, day(10), day(24))).status).toBe(400);
    expect((await send(a.token, b.apartment.id, day(200), day(201))).status).toBe(400);
    expect((await send(a.token, b.apartment.id, day(12), day(10))).status).toBe(400);
    expect((await send(a.token, b.apartment.id, day(0), day(13))).status).toBe(201);
  });

  it('rejects dates already taken in either apartment (409)', async () => {
    const { a, b, c } = await threeFamilies();
    await insertSwap({ senderApartmentId: b.apartment.id, receiverApartmentId: c.apartment.id, start: day(10), end: day(11), status: 'APPROVED' });
    let res = await send(a.token, b.apartment.id, day(11), day(13));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DATES_UNAVAILABLE');

    res = await send(c.token, a.apartment.id, day(9), day(10));
    expect(res.status).toBe(409);
    expect(res.body.error.message).toContain('הדירה שלך');
  });

  it('rejects a duplicate pending offer (409)', async () => {
    const { a, b } = await threeFamilies();
    await send(a.token, b.apartment.id, day(10), day(12));
    const res = await send(a.token, b.apartment.id, day(11), day(13));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_OFFER');
  });

  it('admins cannot send offers (403)', async () => {
    const { b } = await threeFamilies();
    const { token } = await createAdmin();
    expect((await send(token, b.apartment.id, day(10), day(12))).status).toBe(403);
  });
});

describe('reading offers', () => {
  it('lists received and sent offers separately, with status filter', async () => {
    const { a, b, c } = await threeFamilies();
    await send(b.token, a.apartment.id, day(10), day(11));
    await send(c.token, a.apartment.id, day(20), day(21));
    await send(a.token, c.apartment.id, day(30), day(31));

    const received = await api().get('/api/swaps?box=received').set(bearer(a.token));
    expect(received.body.total).toBe(2);
    expect(received.body.items[0]).toMatchObject({ direction: 'RECEIVED', status: 'PENDING' });

    const sent = await api().get('/api/swaps?box=sent').set(bearer(a.token));
    expect(sent.body.total).toBe(1);
    expect(sent.body.items[0].otherApartment.id).toBe(c.apartment.id);

    const all = await api().get('/api/swaps').set(bearer(a.token));
    expect(all.body.total).toBe(3);

    const approved = await api().get('/api/swaps?status=APPROVED').set(bearer(a.token));
    expect(approved.body.total).toBe(0);
  });

  it('a user without an apartment gets an empty list', async () => {
    const { token } = await createUser();
    const res = await api().get('/api/swaps').set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
  });

  it('only parties (and admins) can see an offer; others get 404', async () => {
    const { a, b, c } = await threeFamilies();
    const created = await send(a.token, b.apartment.id, day(10), day(11));
    const id = created.body.swap.id;

    expect((await api().get(`/api/swaps/${id}`).set(bearer(c.token))).status).toBe(404);

    const asReceiver = await api().get(`/api/swaps/${id}`).set(bearer(b.token));
    expect(asReceiver.body.swap).toMatchObject({
      direction: 'RECEIVED',
      allowedActions: { canApprove: true, canReject: true, canWithdraw: false },
      otherParty: { email: 'a@test.com' },
    });

    const { token: adminToken } = await createAdmin();
    const asAdmin = await api().get(`/api/swaps/${id}`).set(bearer(adminToken));
    expect(asAdmin.status).toBe(200);
    expect(asAdmin.body.swap.otherParty).toBeNull();
    expect(asAdmin.body.swap.owners.sender.fullName).toBe('משפחה א');
  });

  it('contact details always reflect the current profile', async () => {
    const { a, b } = await threeFamilies();
    const created = await send(a.token, b.apartment.id, day(10), day(11));
    await api().patch('/api/auth/me').set(bearer(a.token)).send({ phone: '0599999999' });
    const res = await api().get(`/api/swaps/${created.body.swap.id}`).set(bearer(b.token));
    expect(res.body.swap.otherParty.phone).toBe('0599999999');
  });

  it('expires pending offers whose start date has passed', async () => {
    const { a, b } = await threeFamilies();
    const old = await insertSwap({ senderApartmentId: a.apartment.id, receiverApartmentId: b.apartment.id, start: day(-2), end: day(-1) });
    const res = await api().get(`/api/swaps/${old.id}`).set(bearer(b.token));
    expect(res.body.swap.status).toBe('EXPIRED');
    expect(res.body.swap.allowedActions.canApprove).toBe(false);
    expect(res.body.swap.otherParty).toBeNull();
  });
});

describe('approve / reject / withdraw', () => {
  it('only the receiver can approve; approval blocks dates in both calendars', async () => {
    const { a, b } = await threeFamilies();
    const id = (await send(a.token, b.apartment.id, day(10), day(12))).body.swap.id;

    const bySender = await api().post(`/api/swaps/${id}/approve`).set(bearer(a.token));
    expect(bySender.status).toBe(403);

    const res = await api().post(`/api/swaps/${id}/approve`).set(bearer(b.token));
    expect(res.status).toBe(200);
    expect(res.body.swap.status).toBe('APPROVED');
    expect(res.body.swap.allowedActions.canRequestCancel).toBe(true);

    for (const apartmentId of [a.apartment.id, b.apartment.id]) {
      const cal = await api().get(`/api/apartments/${apartmentId}/calendar`);
      expect(cal.body.busyRanges).toEqual([{ startDate: day(10), endDate: day(12), reason: 'SWAP' }]);
    }
  });

  it('auto-rejects every other overlapping pending offer of both apartments', async () => {
    const { a, b, c, city } = await threeFamilies();
    const d = await userWithApartment(city.id);

    const main = (await send(a.token, b.apartment.id, day(10), day(12))).body.swap.id;
    const toReceiver = (await send(c.token, b.apartment.id, day(12), day(13))).body.swap.id; // חופף, לאותה דירה
    const fromSender = (await send(a.token, d.apartment.id, day(11), day(11))).body.swap.id; // השולח הציע גם לאחר
    const toSender = (await send(d.token, a.apartment.id, day(9), day(10))).body.swap.id; // מישהו הציע לשולח
    const notOverlapping = (await send(c.token, b.apartment.id, day(20), day(21))).body.swap.id;

    expect((await api().post(`/api/swaps/${main}/approve`).set(bearer(b.token))).status).toBe(200);

    const status = async (id: number) => (await prisma.swapOffer.findUniqueOrThrow({ where: { id } })).status;
    expect(await status(toReceiver)).toBe('AUTO_REJECTED');
    expect(await status(fromSender)).toBe('AUTO_REJECTED');
    expect(await status(toSender)).toBe('AUTO_REJECTED');
    expect(await status(notOverlapping)).toBe('PENDING');

    // אי אפשר לאשר הצעה שנדחתה אוטומטית
    const late = await api().post(`/api/swaps/${toReceiver}/approve`).set(bearer(b.token));
    expect(late.status).toBe(409);
    expect(late.body.error.code).toBe('INVALID_STATE');
  });

  it('re-checks availability at approval time', async () => {
    const { a, b } = await threeFamilies();
    const id = (await send(a.token, b.apartment.id, day(10), day(12))).body.swap.id;
    // נוצרה בינתיים חסימה ישירות במסד (מצב שלא אמור לקרות דרך ה-API)
    await prisma.blockedDate.create({
      data: { apartmentId: a.apartment.id, startDate: new Date(`${day(11)}T00:00:00Z`), endDate: new Date(`${day(11)}T00:00:00Z`) },
    });
    const res = await api().post(`/api/swaps/${id}/approve`).set(bearer(b.token));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DATES_UNAVAILABLE');
  });

  it('two conflicting approvals at the same time: only one succeeds', async () => {
    const { a, b, c } = await threeFamilies();
    const first = (await send(a.token, b.apartment.id, day(10), day(12))).body.swap.id;
    const second = (await send(c.token, b.apartment.id, day(11), day(13))).body.swap.id;
    const results = await Promise.all([
      api().post(`/api/swaps/${first}/approve`).set(bearer(b.token)),
      api().post(`/api/swaps/${second}/approve`).set(bearer(b.token)),
    ]);
    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([200, 409]);
    expect(await prisma.swapOffer.count({ where: { status: 'APPROVED' } })).toBe(1);
  });

  it('receiver can reject; sender can withdraw; wrong side gets 403', async () => {
    const { a, b } = await threeFamilies();
    const one = (await send(a.token, b.apartment.id, day(10), day(11))).body.swap.id;
    const two = (await send(a.token, b.apartment.id, day(20), day(21))).body.swap.id;

    expect((await api().post(`/api/swaps/${one}/reject`).set(bearer(a.token))).status).toBe(403);
    const rejected = await api().post(`/api/swaps/${one}/reject`).set(bearer(b.token));
    expect(rejected.body.swap.status).toBe('REJECTED');
    expect(rejected.body.swap.otherParty).toBeNull();

    expect((await api().post(`/api/swaps/${two}/withdraw`).set(bearer(b.token))).status).toBe(403);
    const withdrawn = await api().post(`/api/swaps/${two}/withdraw`).set(bearer(a.token));
    expect(withdrawn.body.swap.status).toBe('WITHDRAWN');

    expect((await api().post(`/api/swaps/${two}/withdraw`).set(bearer(a.token))).status).toBe(409);
  });
});

describe('cancelling an approved swap (needs both sides)', () => {
  async function approvedSwap() {
    const fam = await threeFamilies();
    const id = (await send(fam.a.token, fam.b.apartment.id, day(10), day(12))).body.swap.id;
    await api().post(`/api/swaps/${id}/approve`).set(bearer(fam.b.token));
    return { ...fam, id };
  }

  it('full flow: request, reject, request again, withdraw, request again, approve', async () => {
    const { a, b, id } = await approvedSwap();

    let res = await api().post(`/api/swaps/${id}/cancel-request`).set(bearer(a.token)).send({ reason: 'מחלה במשפחה' });
    expect(res.status).toBe(200);
    expect(res.body.swap.status).toBe('APPROVED');
    expect(res.body.swap.cancelRequest).toMatchObject({ isOpen: true, requestedByMe: true, reason: 'מחלה במשפחה' });
    expect(res.body.swap.allowedActions).toMatchObject({ canWithdrawCancelRequest: true, canApproveCancel: false });

    // המבקש לא יכול לאשר את הבקשה של עצמו
    expect((await api().post(`/api/swaps/${id}/cancel-request/approve`).set(bearer(a.token))).status).toBe(403);
    // בקשה שנייה לא אפשרית כל עוד יש פתוחה
    expect((await api().post(`/api/swaps/${id}/cancel-request`).set(bearer(b.token))).status).toBe(409);

    // הצד השני מסרב: ההחלפה נשארת
    res = await api().post(`/api/swaps/${id}/cancel-request/reject`).set(bearer(b.token));
    expect(res.body.swap).toMatchObject({ status: 'APPROVED', cancelRequest: null });

    // בקשה חדשה, והמבקש מושך אותה
    await api().post(`/api/swaps/${id}/cancel-request`).set(bearer(b.token));
    expect((await api().post(`/api/swaps/${id}/cancel-request/withdraw`).set(bearer(a.token))).status).toBe(403);
    res = await api().post(`/api/swaps/${id}/cancel-request/withdraw`).set(bearer(b.token));
    expect(res.body.swap.cancelRequest).toBeNull();

    // בקשה, והצד השני מסכים: ההחלפה מבוטלת והתאריכים משתחררים
    await api().post(`/api/swaps/${id}/cancel-request`).set(bearer(a.token));
    res = await api().post(`/api/swaps/${id}/cancel-request/approve`).set(bearer(b.token));
    expect(res.status).toBe(200);
    expect(res.body.swap.status).toBe('CANCELLED');
    expect(res.body.swap.cancelledAt).toEqual(expect.any(String));

    const cal = await api().get(`/api/apartments/${a.apartment.id}/calendar`);
    expect(cal.body.busyRanges).toEqual([]);
  });

  it('cannot cancel a swap that has started; open requests expire at the start date', async () => {
    const { a, b } = await threeFamilies();
    const started = await insertSwap({
      senderApartmentId: a.apartment.id,
      receiverApartmentId: b.apartment.id,
      start: day(0),
      end: day(2),
      status: 'APPROVED',
      cancelRequestedById: a.user.id,
    });
    const res = await api().get(`/api/swaps/${started.id}`).set(bearer(b.token));
    expect(res.body.swap.status).toBe('APPROVED');
    expect(res.body.swap.cancelRequest).toBeNull();
    expect(res.body.swap.allowedActions.canRequestCancel).toBe(false);

    const req = await api().post(`/api/swaps/${started.id}/cancel-request`).set(bearer(a.token));
    expect(req.status).toBe(409);
    expect(req.body.error.code).toBe('SWAP_STARTED');
  });

  it('cannot request cancel on a pending offer', async () => {
    const { a, b } = await threeFamilies();
    const id = (await send(a.token, b.apartment.id, day(10), day(12))).body.swap.id;
    const res = await api().post(`/api/swaps/${id}/cancel-request`).set(bearer(a.token));
    expect(res.status).toBe(409);
  });

  it('non-parties get 404 on cancel actions', async () => {
    const { c, id } = await approvedSwap();
    expect((await api().post(`/api/swaps/${id}/cancel-request`).set(bearer(c.token))).status).toBe(404);
  });
});
