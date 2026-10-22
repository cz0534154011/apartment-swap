# צד שרת: אתר החלפת דירות לשבתות ולחופשות

שרת REST שמנהל משתמשים, דירות, לוחות תפוסה והצעות החלפה.
כל ההוראות להעלאה לאינטרנט נמצאות בקובץ **START-HERE.md**.
כל מה שצריך לכתיבת ה־React נמצא בקובץ **docs/FRONTEND-API-GUIDE.md**.

## טכנולוגיות

| תחום | כלי |
|---|---|
| שפה וסביבה | Node.js 22, TypeScript (strict), ESM |
| שרת | Express 5 |
| מסד נתונים | PostgreSQL + Prisma ORM |
| ולידציה | Zod, עם הודעות שגיאה בעברית |
| התחברות | JWT (תוקף 24 שעות), סיסמאות מוצפנות ב־bcrypt |
| תיעוד | Swagger UI ב־`/api-docs`, OpenAPI 3 ב־`docs/openapi.json` |
| בדיקות | Vitest + Supertest מול PostgreSQL אמיתי |

## מבנה התיקיות

```
backend/
├── src/
│   ├── server.ts              הפעלת השרת
│   ├── app.ts                 הרכבת Express: אבטחה, CORS, נתיבים, שגיאות
│   ├── config/env.ts          קריאה ובדיקה של משתני הסביבה
│   ├── db/prisma.ts           החיבור למסד
│   ├── middleware/            התחברות והרשאות (auth), טיפול מרכזי בשגיאות
│   ├── modules/               כל תחום בתיקייה משלו:
│   │   ├── auth/              הרשמה, התחברות, פרופיל
│   │   ├── cities/            ניהול ערים
│   │   ├── apartments/        חיפוש, צפייה, לוח תפוסה, "הדירה שלי", חסימות
│   │   ├── swaps/             הצעות החלפה, אישור, ביטול, וחוקי זמינות
│   │   ├── admin/             מסכי המנהל
│   │   └── site/              בדיקת בריאות ותקנון
│   │       (בכל תחום: routes = כתובות, controller = קבלת הבקשה,
│   │        service = הלוגיקה, schemas = ולידציה)
│   ├── utils/                 תאריכים, שגיאות, ולידציה, חלוקה לעמודים
│   ├── docs/swagger.ts        הגשת Swagger
│   └── seed/run.ts            נתוני הדגמה
├── prisma/
│   ├── schema.prisma          מבנה המסד
│   └── migrations/            יצירת הטבלאות, כולל אילוצי תקינות
├── tests/                     בדיקות אוטומטיות
├── docs/
│   ├── openapi.json           תיעוד ה־API
│   └── FRONTEND-API-GUIDE.md  מדריך לכתיבת ה־React
├── render.yaml                הגדרות פריסה ל־Render
├── START-HERE.md              הוראות העלאה לאינטרנט
└── .env.example               דוגמה למשתני סביבה
```

## הרצה מקומית

דרוש Node.js 20 ומעלה, וכתובת חיבור למסד PostgreSQL (הדרך הפשוטה: Neon, ראו START-HERE.md שלב 1).

```bash
cd backend
copy .env.example .env            # ב-Mac/Linux: cp .env.example .env
# לערוך את .env ולהדביק DATABASE_URL ו-JWT_SECRET
npm install
npm run db:deploy                 # יצירת הטבלאות
npm run db:seed                   # נתוני הדגמה
npm run dev                       # השרת עולה ב-http://localhost:3000
```

ואז לפתוח בדפדפן: http://localhost:3000/api-docs

משתמשי הדגמה בסביבת פיתוח:
| תפקיד | מייל | סיסמה |
|---|---|---|
| מנהל | admin@example.com | Admin1234 |
| משתמש | cohen@example.com | Demo1234 |
| משתמש | levi@example.com | Demo1234 |
| משתמש | friedman@example.com | Demo1234 |
| משתמש | goldberg@example.com | Demo1234 |

בענן לא נוצרות הסיסמאות האלה. שם קובעים סיסמאות במשתני סביבה (ראו START-HERE.md).

## בדיקות

```bash
copy .env.test.example .env.test  # מסד נפרד לבדיקות! שם המסד חייב לכלול "test"
npm run check                     # בדיקת טיפוסים + בנייה + כל הבדיקות
```

הבדיקות בונות את מסד הבדיקות מאפס ומוחקות בו את כל הנתונים, ולכן הן מסרבות לרוץ על מסד שהשם שלו לא כולל `test`.

## פקודות

| פקודה | מה היא עושה |
|---|---|
| `npm run dev` | הרצה בפיתוח עם טעינה מחדש בכל שינוי |
| `npm run build` | בנייה ל־`dist/` |
| `npm start` | הרצת הגרסה הבנויה |
| `npm run start:prod` | לענן: Migrations, Seed ואז הרצה |
| `npm run typecheck` | בדיקת טיפוסי TypeScript |
| `npm test` | הרצת הבדיקות |
| `npm run check` | הכל ביחד |
| `npm run db:deploy` | הפעלת Migrations |
| `npm run db:seed` | נתוני הדגמה |
| `npm run db:migrate` | יצירת Migration חדש אחרי שינוי ב־schema.prisma |

## משתני סביבה

| משתנה | חובה | תיאור |
|---|---|---|
| `DATABASE_URL` | כן | כתובת החיבור ל־PostgreSQL |
| `JWT_SECRET` | כן | סוד לחתימת ה־Token, לפחות 32 תווים |
| `JWT_EXPIRES_IN` | לא | תוקף ה־Token, ברירת מחדל `24h` |
| `PORT` | לא | ברירת מחדל 3000. Render קובע לבד |
| `NODE_ENV` | לא | `development` / `production` |
| `CORS_ORIGIN` | לא | כתובות האתר שמותר להן לפנות, מופרדות בפסיק. `*` לכולם |
| `ADMIN_CONTACT_EMAIL` | לא | המייל של מנהל האתר שמוצג למשתמשים |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | בענן | יצירת חשבון המנהל |
| `SEED_DEMO_DATA`, `DEMO_USER_PASSWORD` | לא | נתוני הדגמה בענן |

## מסד הנתונים בקצרה

| טבלה | תפקיד |
|---|---|
| `User` | משתמשים ומנהלים. סיסמה שמורה כ־Hash בלבד |
| `City` | רשימת הערים, מנוהלת על ידי המנהל |
| `Apartment` | הדירה (אחת לכל משתמש): פרטים, אביזרי שבת, סטטוס, חסימה |
| `BlockedDate` | תאריכים שבעל הדירה חסם ידנית |
| `SwapOffer` | הצעות החלפה לכל אורך חייהן, כולל בקשות ביטול |

לוח התפוסה לא נשמר בנפרד: הוא מחושב בכל בקשה מתוך ההחלפות המאושרות והחסימות.

## אבטחה

- סיסמאות נשמרות רק כ־Hash של bcrypt. אף תשובה לא מחזירה סיסמה או Hash.
- כל נתיב פרטי דורש `Authorization: Bearer <token>`. בלי Token: 401. בלי הרשאה: 403.
- המשתמש מזוהה תמיד לפי ה־Token, וגם התפקיד נלקח מהמסד ולא מה־Token.
- "הדירה שלי" נמצאת לפי ה־Token, בלי מזהה בכתובת, כך שאי אפשר לגעת בדירה של אחר.
- רשומה פרטית של מישהו אחר מחזירה 404, כדי לא לחשוף שהיא קיימת.
- פעולות שנוגעות בזמינות (אישור, חסימה) רצות בטרנזקציה עם נעילת שורות, כך ששני אישורים סותרים לא יכולים להצליח יחד.
