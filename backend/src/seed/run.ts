import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient, type Prisma } from '@prisma/client';
import { addDays, todayYmd, ymdToDate } from '../utils/dates.js';

/**
 * נתוני הדגמה. כל השמות והפרטים מומצאים.
 *
 * בפיתוח (NODE_ENV שאינו production):
 *   נוצרים מנהל ומשתמשי דוגמה עם סיסמאות ידועות, כדי שיהיה קל לבדוק.
 *
 * בענן (NODE_ENV=production):
 *   - לא נוצרות סיסמאות קבועות וידועות לציבור.
 *   - מנהל נוצר רק אם הוגדרו ADMIN_EMAIL ו-ADMIN_PASSWORD.
 *   - משתמשי דוגמה נוצרים רק אם SEED_DEMO_DATA=true וגם הוגדר DEMO_USER_PASSWORD.
 *
 * אפשר להריץ את הקובץ שוב ושוב: הוא לא יוצר כפילויות.
 */

const prisma = new PrismaClient();
const isProduction = process.env.NODE_ENV === 'production';

const CITIES = ['ירושלים', 'בני ברק', 'בית שמש', 'מודיעין עילית', 'ביתר עילית', 'אלעד', 'צפת', 'טבריה'];

interface DemoUser {
  fullName: string;
  email: string;
  phone: string;
  apartment: Omit<Prisma.ApartmentUncheckedCreateInput, 'ownerId' | 'cityId'> & { city: string };
}

const DEMO_USERS: DemoUser[] = [
  {
    fullName: 'משפחת כהן',
    email: 'cohen@example.com',
    phone: '0501234567',
    apartment: {
      city: 'ירושלים',
      title: 'דירת 4 חדרים מרווחת ליד בית הכנסת',
      neighborhood: 'רמות',
      rooms: 4,
      beds: 7,
      floor: 2,
      hasElevator: true,
      hasPlata: true,
      hasUrn: true,
      hasShabbatClock: true,
      hasEruv: true,
      hasGenerator: false,
      description: 'דירה מרווחת ומוארת, שתי דקות הליכה מבית הכנסת. מטבח מאובזר, מרפסת סוכה גדולה, וגן משחקים בסמוך.',
    },
  },
  {
    fullName: 'משפחת לוי',
    email: 'levi@example.com',
    phone: '052-7654321',
    apartment: {
      city: 'בני ברק',
      title: 'דירת 5 חדרים במרכז העיר',
      neighborhood: 'רמת אהרן',
      rooms: 5,
      beds: 9,
      floor: 3,
      hasElevator: true,
      hasPlata: true,
      hasUrn: true,
      hasShabbatClock: true,
      hasEruv: true,
      hasGenerator: true,
      description: 'דירה גדולה למשפחה ברוכת ילדים. קרוב לבתי כנסת רבים ולמכולות. יש מיטת תינוק ולול.',
    },
  },
  {
    fullName: 'משפחת פרידמן',
    email: 'friedman@example.com',
    phone: '0533334444',
    apartment: {
      city: 'צפת',
      title: 'דירת נופש 3.5 חדרים עם נוף להרים',
      neighborhood: 'העיר העתיקה',
      rooms: 3.5,
      beds: 5,
      floor: 1,
      hasElevator: false,
      hasPlata: true,
      hasUrn: true,
      hasShabbatClock: false,
      hasEruv: true,
      hasGenerator: false,
      description: 'דירה שקטה בלב העיר העתיקה, נוף מרהיב, אוויר הרים צלול. מתאימה לזוג עם ילדים קטנים.',
    },
  },
  {
    fullName: 'משפחת גולדברג',
    email: 'goldberg@example.com',
    phone: '0549998888',
    apartment: {
      city: 'בית שמש',
      title: 'דירת גן 4 חדרים עם חצר',
      neighborhood: 'רמת בית שמש א',
      rooms: 4,
      beds: 6,
      floor: 0,
      hasElevator: false,
      hasPlata: true,
      hasUrn: false,
      hasShabbatClock: true,
      hasEruv: true,
      hasGenerator: false,
      description: 'דירת גן עם חצר גדולה ומגודרת, מתאימה במיוחד לילדים. בית כנסת בבניין הסמוך.',
    },
  },
];

async function seedCities() {
  for (const name of CITIES) {
    await prisma.city.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log(`Cities: ${CITIES.length} ensured`);
}

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL ?? (isProduction ? '' : 'admin@example.com')).trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? (isProduction ? '' : 'Admin1234');
  if (!email || !password) {
    console.log('Admin: skipped (set ADMIN_EMAIL and ADMIN_PASSWORD to create an admin)');
    return;
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin: ${email} already exists`);
    return;
  }
  await prisma.user.create({
    data: {
      fullName: 'מנהל האתר',
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: 'ADMIN',
      termsAcceptedAt: new Date(),
    },
  });
  console.log(`Admin: ${email} created`);
}

async function seedDemoData() {
  const wantDemo = isProduction ? process.env.SEED_DEMO_DATA === 'true' : process.env.SEED_DEMO_DATA !== 'false';
  const password = process.env.DEMO_USER_PASSWORD ?? (isProduction ? '' : 'Demo1234');
  if (!wantDemo || !password) {
    console.log('Demo data: skipped');
    return;
  }
  if (await prisma.user.findUnique({ where: { email: DEMO_USERS[0]!.email } })) {
    console.log('Demo data: already exists');
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const apartmentIds: number[] = [];

  for (const demo of DEMO_USERS) {
    const { city, ...apartmentData } = demo.apartment;
    const cityRow = await prisma.city.findUniqueOrThrow({ where: { name: city } });
    const user = await prisma.user.create({
      data: {
        fullName: demo.fullName,
        email: demo.email,
        phone: demo.phone.replace(/\D/g, ''),
        passwordHash,
        role: 'USER',
        termsAcceptedAt: new Date(),
      },
    });
    const apartment = await prisma.apartment.create({
      data: { ...apartmentData, ownerId: user.id, cityId: cityRow.id },
    });
    apartmentIds.push(apartment.id);
  }

  const [cohen, levi, friedman, goldberg] = apartmentIds as [number, number, number, number];
  const today = todayYmd();
  const d = (n: number) => ymdToDate(addDays(today, n));

  // החלפה מאושרת: כהן ולוי, בעוד כשבועיים
  await prisma.swapOffer.create({
    data: {
      senderApartmentId: cohen,
      receiverApartmentId: levi,
      startDate: d(14),
      endDate: d(16),
      message: 'נשמח להחליף לשבת. יש לנו ילדים קטנים, הבית מוכן לאירוח.',
      status: 'APPROVED',
      respondedAt: new Date(),
    },
  });
  // הצעה ממתינה: פרידמן מציע לכהן
  await prisma.swapOffer.create({
    data: {
      senderApartmentId: friedman,
      receiverApartmentId: cohen,
      startDate: d(28),
      endDate: d(30),
      message: 'נשמח לשבת בירושלים, ואתם מוזמנים ליהנות מהנוף בצפת.',
    },
  });
  // הצעה שנדחתה: גולדברג ללוי
  await prisma.swapOffer.create({
    data: {
      senderApartmentId: goldberg,
      receiverApartmentId: levi,
      startDate: d(21),
      endDate: d(23),
      status: 'REJECTED',
      respondedAt: new Date(),
    },
  });
  // חסימה ידנית אצל פרידמן
  await prisma.blockedDate.create({
    data: { apartmentId: friedman, startDate: d(7), endDate: d(9), note: 'אורחים מהמשפחה' },
  });

  console.log(`Demo data: ${DEMO_USERS.length} users with apartments, 3 offers, 1 blocked range`);
}

async function main() {
  await seedCities();
  await seedAdmin();
  await seedDemoData();
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
