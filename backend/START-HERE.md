# מתחילים כאן: הרצת השרת והעלאתו לאינטרנט

המדריך הזה מיועד למי שמעולם לא העלה שרת לאינטרנט. עוברים לפי הסדר, שלב אחרי שלב.

**בסוף התהליך יהיו לך:**
- הקוד ב־GitHub (לצורך ההגשה).
- מסד נתונים PostgreSQL בענן, ב־Neon (חינם, בלי כרטיס אשראי).
- השרת פועל באינטרנט, ב־Render (חינם), עם Swagger לבדיקה.

> **הערה חשובה על שמות כפתורים:** את שמות הכפתורים כתבתי לפי הממשקים של האתרים כפי שאני מכיר אותם. לא יכולתי לפתוח את האתרים ולוודא את המצב העדכני, ולכן ייתכן שכפתור נקרא קצת אחרת או נמצא במקום אחר. הערכים שצריך להקליד (פקודות, שמות משתנים) הם מדויקים.
>
> **על המסלולים החינמיים (נבדק באוקטובר 2026):** שרת חינמי ב־Render "נרדם" אחרי 15 דקות בלי שימוש, והפנייה הראשונה אחרי זה לוקחת בערך דקה. זה תקין. מסד נתונים חינמי של Render נמחק אחרי 30 יום, ולכן אנחנו משתמשים ב־Neon, שהמסלול החינמי שלו קבוע. גם ב־Neon המסד "נרדם" אחרי כמה דקות ומתעורר לבד בפנייה הבאה.

---

## שלב 0: סידור התיקיות

מומלץ שתיקיית הפרויקט תיראה כך:

```
Chani-Zonenshein-React-Project/
├── backend/      ← השרת (התיקייה הזו)
└── client/       ← פרויקט ה־React שלך (תיצור בעצמך)
```

כך הכל נמצא ב־Repository אחד ב־GitHub, וזה מה שמגישים.

> **חשוב: נתיב באנגלית בלבד.** שמרו את תיקיית הפרויקט במקום שבנתיב שלו אין עברית ואין רווחים, למשל `D:\projects\Chani-Zonenshein-React-Project`. כלי הבדיקות (Vitest) לא מוצא את קבצי הבדיקות כשבנתיב יש עברית או רווחים, ומופיעה ההודעה `No test files found`.

---

## שלב 1: מסד נתונים ב־Neon

עושים את זה ראשון, כי צריך את כתובת המסד גם להרצה במחשב וגם לענן.

### 1. פתיחת חשבון
1. נכנסים ל־https://neon.com
2. לוחצים **Sign up**, ונרשמים עם מייל (או עם חשבון Google או GitHub, אם יש).

### 2. יצירת פרויקט
1. אחרי הכניסה מתבקשים ליצור פרויקט (**Create project**).
2. **Project name:** `apartment-swap`
3. **Postgres version:** להשאיר את ברירת המחדל.
4. **Region:** לבחור אזור באירופה, למשל **Europe (Frankfurt)**. חשוב שיהיה קרוב לאזור שתבחר אחר כך ב־Render.
5. לוחצים **Create**.

### 3. יצירת שלושה מסדי נתונים
נשתמש בשלושה מסדים נפרדים: לפיתוח, לבדיקות ולענן.

1. בתפריט הצד של הפרויקט: **Databases** (לפעמים נמצא תחת **Branches** ← `main` ← **Databases**).
2. לוחצים **New Database**, כותבים את השם, ובוחרים את המשתמש (Owner) שכבר קיים, למשל `neondb_owner`.
3. חוזרים על זה שלוש פעמים, עם השמות: `swap_dev`, `swap_test`, `swap_prod`.

דרך חלופית: **SQL Editor**, ולהריץ **כל שורה בנפרד** (פקודה אחת בכל הרצה):
```sql
CREATE DATABASE swap_dev;
```
ואחר כך `CREATE DATABASE swap_test;` ואחר כך `CREATE DATABASE swap_prod;`

### 4. קבלת כתובת החיבור (Connection String)
1. בעמוד הראשי של הפרויקט לוחצים **Connect** (או **Connection Details**).
2. **מכבים** את האפשרות **Connection pooling** (אנחנו צריכים חיבור ישיר. כתובת עם `-pooler` בשם השרת היא החיבור המשותף, ולא אותה רוצים).
3. מעתיקים את הכתובת. היא נראית בערך כך:
```
postgresql://neondb_owner:AbC123xyz@ep-cool-name-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require
```
4. מכינים ממנה **שלוש כתובות**, על ידי החלפת שם המסד `neondb` (המילה שאחרי ה־`/` האחרון) והוספת `&connect_timeout=15` בסוף:
```
פיתוח:   postgresql://...neon.tech/swap_dev?sslmode=require&connect_timeout=15
בדיקות:  postgresql://...neon.tech/swap_test?sslmode=require&connect_timeout=15
ענן:     postgresql://...neon.tech/swap_prod?sslmode=require&connect_timeout=15
```

### 5. שמירה בטוחה
- הכתובת כוללת סיסמה. **לא** מעלים אותה ל־GitHub, לא שולחים בצ'אט ולא מצלמים מסך.
- שומרים אותה רק בשני מקומות: בקובץ `.env` במחשב שלך, ובהגדרות של Render.
- אם הכתובת דלפה: ב־Neon אפשר לאפס את הסיסמה של המשתמש (**Roles** ← **Reset password**) ולעדכן את הכתובת בשני המקומות.

---

## שלב 1א: אם סינון האינטרנט חוסם את Neon (מסד מקומי)

אם בהרצה במחשב מופיעה השגיאה `P1011: Error opening a TLS connection: ... server does not support TLS` (או `P1001: Can't reach database server`), סינון האינטרנט חוסם חיבור ישיר למסדי נתונים. זה לא משפיע על הענן: Render מתחבר ל־Neon בלי סינון. אבל לפיתוח ולבדיקות במחשב צריך מסד מקומי:

1. **הורדה:** https://www.postgresql.org/download/windows/ ← **Download the installer** ← הגרסה העליונה, עמודת **Windows x86-64**.
2. **התקנה:** להשאיר מסומנים **PostgreSQL Server**, **pgAdmin 4**, **Command Line Tools**. לבחור סיסמה **באותיות באנגלית ומספרים בלבד** ולרשום אותה. Port: `5432`.
3. **יצירת מסדים:** לפתוח **pgAdmin 4** ← **Servers** ← **PostgreSQL** (הסיסמה מההתקנה) ← קליק ימני על **Databases** ← **Create** ← **Database...** ← `swap_dev` ← **Save**. ושוב עבור `swap_test`.
4. **בקבצים** (במקום כתובות Neon):
   - `.env`: `DATABASE_URL="postgresql://postgres:<הסיסמה>@localhost:5432/swap_dev?schema=public"`
   - `.env.test`: `DATABASE_URL="postgresql://postgres:<הסיסמה>@localhost:5432/swap_test?schema=public"`

את המסד `swap_prod` ב־Neon משאירים לענן (שלב 4).

---

## שלב 2: הרצה ובדיקה במחשב שלך

לפני שמעלים לאינטרנט, מוודאים שהכל עובד אצלך.

### 1. יצירת קבצי ההגדרות
פותחים את התיקייה `backend` ב־VS Code, ובטרמינל (**Terminal** ← **New Terminal**) מריצים:
```
copy .env.example .env
copy .env.test.example .env.test
```

### 2. מילוי הקבצים
**בקובץ `.env`:**
- `DATABASE_URL` = כתובת **הפיתוח** (`swap_dev`), בתוך מרכאות.
- `JWT_SECRET` = מחרוזת אקראית ארוכה. אפשר ליצור כזו בטרמינל:
  ```
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```

**בקובץ `.env.test`:**
- `DATABASE_URL` = כתובת **הבדיקות** (`swap_test`).

> הבדיקות מוחקות את כל הנתונים במסד שלהן. לכן הן מסרבות לרוץ על מסד שהשם שלו לא כולל את המילה `test`.

### 3. התקנה ובדיקה
```
npm install
npm run check
```
- `npm install` מתקין את כל החבילות (לוקח דקה או שתיים) ויוצר קובץ בשם `package-lock.json`. **את הקובץ הזה צריך לשמור ולהעלות ל־GitHub.**
- `npm run check` בודק טיפוסים, בונה את השרת ומריץ את כל הבדיקות האוטומטיות מול מסד הבדיקות. מול מסד בענן זה יכול לקחת כמה דקות.

בסוף אמורה להופיע שורה עם מספר הבדיקות שעברו, ובלי `failed`.

### 4. הפעלת השרת
```
npm run db:deploy
npm run db:seed
npm run dev
```
פותחים בדפדפן:
- http://localhost:3000/api/health ← אמור להופיע `"status":"ok"`
- http://localhost:3000/api-docs ← Swagger

משתמשי הדגמה במחשב שלך: `admin@example.com` / `Admin1234`, ו־`cohen@example.com` / `Demo1234`.

לעצירת השרת: `Ctrl+C` בטרמינל.

---

## שלב 3: העלאה ל־GitHub

### 1. פתיחת חשבון
1. נכנסים ל־https://github.com ולוחצים **Sign up**.
2. ממלאים מייל, סיסמה ושם משתמש, ומאשרים את המייל.

### 2. יצירת Repository
1. מימין למעלה לוחצים **+** ← **New repository**.
2. **Repository name:** למשל `apartment-swap`.
3. **Public** או **Private:** אם בוחרים Private, צריך להוסיף את המורה כ־Collaborator (**Settings** ← **Collaborators**) כדי שתוכל לראות את הקוד. בדוק עם המורה מה נדרש.
4. **לא** לסמן Add a README (יש כבר).
5. לוחצים **Create repository**.

### 3. חילוץ ה־ZIP (אם קיבלת את השרת כקובץ ZIP)
לחיצה ימנית על הקובץ ← **Extract All** (חלץ הכל) ← בוחרים את תיקיית הפרויקט. התוצאה צריכה להיות תיקייה בשם `backend` בתוך תיקיית הפרויקט.

### 4. העלאת הקבצים

> **אזהרה חשובה:** העלאה דרך הדפדפן **לא** מתחשבת בקובץ `.gitignore`. כל מה שתגרור, יעלה. לכן:
> - **לא** לגרור את התיקיות `node_modules` ו־`dist`.
> - **לא** לגרור את הקבצים `.env` ו־`.env.test` (הם מכילים סיסמאות!).

**דרך הדפדפן:**
1. בעמוד ה־Repository החדש לוחצים **uploading an existing file** (או **Add file** ← **Upload files**).
2. גוררים את תיקיית `backend`, **אחרי** שמחקת ממנה זמנית או הוצאת ממנה את `node_modules`, `dist`, `.env` ו־`.env.test`. (דרך פשוטה: לחלץ שוב את ה־ZIP למקום אחר, להעתיק לשם את `package-lock.json` שנוצר אצלך, ולגרור משם.)
3. למטה, ב־**Commit changes**, לוחצים על הכפתור הירוק.

**דרך מומלצת יותר: GitHub Desktop** (תוכנה חינמית של GitHub). היא כן מכבדת את `.gitignore`, ולכן לא תעלה בטעות את `node_modules` או סיסמאות, ונוח לעדכן איתה את הקוד שוב ושוב. מורידים מ־https://desktop.github.com, מתחברים, בוחרים **Add an Existing Repository** ובוחרים את תיקיית הפרויקט.

### 5. בדיקה שהקבצים הגיעו
בעמוד ה־Repository צריכים להופיע: `backend/src`, `backend/prisma`, `backend/package.json`, `backend/package-lock.json`, `backend/render.yaml`.
**ודא שאין** `node_modules` ואין `.env`. אם `.env` עלה בטעות: למחוק אותו מ־GitHub, ולאפס את סיסמת המסד ב־Neon ואת `JWT_SECRET`.

---

## שלב 4: העלאת השרת ל־Render

### 1. פתיחת חשבון
1. נכנסים ל־https://render.com ← **Get Started**.
2. הכי פשוט: **GitHub** (התחברות עם חשבון ה־GitHub). מאשרים ל־Render גישה ל־Repository של הפרויקט.

### 2. יצירת Web Service
1. בלוח הבקרה: **New +** ← **Web Service**.
2. בוחרים את ה־Repository (`apartment-swap`). אם הוא לא מופיע: **Configure account** ומאשרים גישה אליו.

### 3. ההגדרות (בדיוק כך)
| שדה | ערך |
|---|---|
| **Name** | `apartment-swap-api` (יקבע את הכתובת: `https://apartment-swap-api.onrender.com`. אם השם תפוס, Render יוסיף תווים) |
| **Region** | **Frankfurt (EU Central)**, אותו אזור כמו Neon |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime / Language** | `Node` |
| **Build Command** | `npm install --include=dev && npm run build` |
| **Start Command** | `npm run start:prod` |
| **Instance Type** | **Free** |

### 4. משתני סביבה (Environment Variables)
באותו עמוד, באזור **Environment Variables**, מוסיפים אחד אחד (**Add Environment Variable**):

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `22` |
| `DATABASE_URL` | כתובת **הענן** מ־Neon (`swap_prod`), בלי מרכאות |
| `JWT_SECRET` | מחרוזת אקראית ארוכה **חדשה** (לא זו של המחשב). אפשר ללחוץ **Generate** אם מופיע |
| `JWT_EXPIRES_IN` | `24h` |
| `CORS_ORIGIN` | בינתיים `*`. אחרי שה־React יעלה לאינטרנט, מחליפים לכתובת שלו (ראו שלב 6) |
| `ADMIN_CONTACT_EMAIL` | המייל שיוצג למשתמשים לפניות |
| `ADMIN_EMAIL` | המייל שבו המנהל יתחבר |
| `ADMIN_PASSWORD` | סיסמה חזקה למנהל (לפחות 8 תווים, אות וספרה) |
| `SEED_DEMO_DATA` | `true` (כדי שיהיו דירות לדוגמה בהצגה) |
| `DEMO_USER_PASSWORD` | סיסמה למשתמשי הדוגמה (cohen@example.com וכו') |

### 5. Health Check
פותחים **Advanced**, ובשדה **Health Check Path** כותבים: `/api/health`

### 6. Deploy
1. לוחצים **Create Web Service** (או **Deploy Web Service**).
2. מופיע מסך של **Logs**. רואים את ההתקנה, הבנייה, ואז:
   - `prisma migrate deploy`: יצירת הטבלאות במסד (Prisma Migrations רצות אוטומטית בכל הפעלה, אין צורך לעשות שום דבר ידני).
   - `Cities: 8 ensured`, `Admin: ... created`: נתוני הבסיס.
   - `Server listening on port ...`
3. כשמופיע **Live** (או "Your service is live"), השרת באוויר. הכתובת מופיעה למעלה בעמוד.

### 7. עדכונים
בכל פעם שמעלים שינוי ל־GitHub (לענף `main`), Render בונה ומעלה מחדש אוטומטית.

---

## שלב 5: בדיקה שהכל עובד בענן

מחליפים `YOUR-APP` בשם השירות שלך.

1. **בדיקת בריאות:** פותחים `https://YOUR-APP.onrender.com/api/health`
   צריך להופיע: `{"status":"ok","database":"ok",...}`. (בפעם הראשונה אחרי "שינה" זה יכול לקחת דקה.)
2. **Swagger:** פותחים `https://YOUR-APP.onrender.com/api-docs`
3. **התחברות:** ב־Swagger פותחים **POST /api/auth/login** ← **Try it out**, כותבים:
   ```json
   { "email": "המייל של ADMIN_EMAIL", "password": "הסיסמה של ADMIN_PASSWORD" }
   ```
   ← **Execute**.
4. **קבלת JWT:** בתשובה (Response body) מעתיקים את הערך של `token` (בלי המרכאות).
5. **Authorize:** לוחצים על הכפתור **Authorize** למעלה, מדביקים את ה־token ← **Authorize** ← **Close**.
6. **קריאה מוגנת:** פותחים **GET /api/auth/me** ← **Try it out** ← **Execute**. צריך לחזור 200 עם פרטי המנהל.
   לבדיקת 401: **Authorize** ← **Logout**, ולהריץ שוב: יחזור 401.
   לבדיקת 403: להתחבר כמשתמש דוגמה (`cohen@example.com` עם `DEMO_USER_PASSWORD`), ולהריץ **GET /api/admin/users**: יחזור 403.
7. **הוספת רשומה:** נרשמים כמשתמש חדש ב־**POST /api/auth/register**, עושים Authorize עם ה־token שחזר, ואז **POST /api/my/apartment** עם הדוגמה שכבר ממולאת (`cityId` של עיר מתוך **GET /api/cities**). צריך לחזור 201.
8. **שליפה מהמסד:** **GET /api/my/apartment**, או **GET /api/apartments/{id}** עם ה־id שחזר. הדירה מגיעה מהמסד ב־Neon. אפשר לראות אותה גם ב־Neon: **Tables** ← `Apartment`.

---

## שלב 6: חיבור ה־React לשרת

(את קוד ה־React כותבים בעצמך. כאן רק ההגדרות.)

1. ב־React שומרים את כתובת השרת במשתנה סביבה, למשל בקובץ `client/.env`:
   ```
   VITE_API_URL=http://localhost:3000
   ```
   ובענן: `https://YOUR-APP.onrender.com`. (ב־Vite, משתנים שזמינים לקוד חייבים להתחיל ב־`VITE_`.)
2. **העלאת ה־React ל־Render** כ־Static Site: **New +** ← **Static Site**, אותו Repository:
   | שדה | ערך |
   |---|---|
   | Root Directory | `client` |
   | Build Command | `npm install && npm run build` |
   | Publish Directory | `dist` |
   | Environment Variable | `VITE_API_URL` = כתובת השרת |

   ובלשונית **Redirects/Rewrites** מוסיפים כלל: Source `/*`, Destination `/index.html`, Action **Rewrite**. בלי זה, רענון של עמוד פנימי (React Router) יחזיר שגיאת 404.
3. **CORS:** אחרי שהאתר עלה, חוזרים לשירות השרת ב־Render ← **Environment**, ומשנים את `CORS_ORIGIN` לכתובת האתר, למשל:
   ```
   https://apartment-swap-client.onrender.com,http://localhost:5173
   ```
   (הכתובת השנייה כדי שיעבוד גם בפיתוח במחשב.) בלי לוכסן בסוף.

---

## שלב 7: פתרון תקלות

| תקלה | מה רואים | פתרון |
|---|---|---|
| **Build Failed** | ב־Logs של Render: `npm ERR!` או שגיאת TypeScript | ודא ש־**Root Directory** הוא `backend` ושה־**Build Command** הועתק בדיוק. ודא ש־`package-lock.json` עלה ל־GitHub. הרץ `npm run check` במחשב: אם יש שם שגיאה, היא גם הסיבה בענן |
| **DATABASE_URL שגוי** | `Invalid environment variables: DATABASE_URL` או `P1001: Can't reach database server` | העתק שוב מ־Neon את כתובת החיבור **הישיר** (בלי `-pooler`). ודא שהיא מסתיימת ב־`?sslmode=require&connect_timeout=15`, בלי מרכאות ב־Render ובלי רווחים |
| **בעיית Prisma** | `P3009 migrate found failed migrations` או `relation "User" does not exist` | ב־Neon, ב־SQL Editor, על מסד `swap_prod`: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` (מוחק את כל הנתונים במסד הזה!) ואז **Manual Deploy** ← **Deploy latest commit** ב־Render |
| **JWT_SECRET חסר** | `JWT_SECRET must be at least 32 characters long` | הוסף ב־Render ← **Environment** משתנה `JWT_SECRET` עם לפחות 32 תווים, ושמור |
| **שגיאת CORS** | בדפדפן (F12 ← Console): `blocked by CORS policy` | עדכן את `CORS_ORIGIN` בשרת לכתובת המדויקת של האתר (עם `https://`, בלי `/` בסוף). אחרי שמירה Render מפעיל מחדש |
| **401** | `AUTH_REQUIRED`, `INVALID_TOKEN` או `TOKEN_EXPIRED` | לא נשלח Token, נשלח לא נכון, או שעברו 24 שעות. התחבר מחדש. ב־React: ודא שהכותרת היא בדיוק `Authorization: Bearer <token>` |
| **403** | `FORBIDDEN` / `ACTION_NOT_ALLOWED` | המשתמש מחובר אבל אין לו הרשאה: למשל משתמש רגיל בפעולת מנהל, או מנהל שמנסה לפרסם דירה. התחבר עם המשתמש הנכון |
| **Swagger לא נפתח** | עמוד ריק או 404 | ודא שהכתובת היא `/api-docs` (עם מקף). אם השרת "ישן", חכה דקה ורענן |
| **השרת לא עולה** | ב־Logs: `Invalid environment variables` | בהודעה כתוב איזה משתנה חסר. הוסף אותו ב־**Environment** |
| **השרת לא עולה** | `Exited with status 1` אחרי `prisma migrate deploy` | בעיה בחיבור למסד, ראו "DATABASE_URL שגוי" |
| **הפנייה הראשונה איטית מאוד** | דקה עד שמשהו קורה | זה תקין במסלול החינמי: השרת "נרדם" אחרי 15 דקות בלי שימוש. כדאי לפתוח את `/api/health` כמה דקות לפני הצגת הפרויקט |
| **אין מנהל בענן** | התחברות עם המייל של המנהל נכשלת | ודא ש־`ADMIN_EMAIL` ו־`ADMIN_PASSWORD` מוגדרים, ועשה **Manual Deploy**. שים לב: אם המנהל כבר נוצר, שינוי הסיסמה במשתנה לא משנה אותה במסד |
| **`P1011 ... server does not support TLS`** | בהרצה במחשב, מול Neon | סינון האינטרנט חוסם חיבור ישיר למסד. להשתמש במסד מקומי (שלב 1א). בענן זה לא קורה |
| **`No test files found`** | בהרצת הבדיקות | בנתיב של התיקייה יש עברית או רווחים. להעביר את הפרויקט לנתיב באנגלית, למשל `D:\projects\...` |
| **`npm install` נכשל עם `ECONNRESET`** | שגיאת רשת באמצע ההתקנה | להריץ `npm config set fetch-retries 6`, ואז שוב `npm install --prefer-offline`. כל ניסיון ממשיך מאיפה שהקודם נעצר |
| **הבדיקות לא רצות במחשב** | `Missing .env.test file` או `Refusing to run tests` | צור `.env.test` מ־`.env.test.example`, ושם המסד בכתובת חייב לכלול `test` |
