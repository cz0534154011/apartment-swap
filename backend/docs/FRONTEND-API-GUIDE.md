# מדריך ה־API לכתיבת צד ה־React

המסמך מסביר מה השרת מצפה לקבל ומה הוא מחזיר, מסך אחר מסך. אין כאן קוד React: את הקוד כותבים בעצמך.
התיעוד המלא והאינטראקטיבי נמצא ב־Swagger: `<BASE_URL>/api-docs`.

---

## 1. כתובת השרת (Base URL)

| סביבה | כתובת |
|---|---|
| במחשב | `http://localhost:3000` |
| בענן | `https://YOUR-APP.onrender.com` |

מומלץ לשמור את הכתובת במשתנה סביבה של Vite (למשל `VITE_API_URL`), ולא לכתוב אותה ישירות בקוד. כל הכתובות במסמך מתחילות ב־`/api`.

**כללים לכל הבקשות:**
- גוף הבקשה תמיד JSON, עם הכותרת `Content-Type: application/json`.
- **מספרים נשלחים כמספרים**, לא כטקסט: `"beds": 6` ולא `"beds": "6"`. (שדות מספר בטופס מחזירים טקסט, וצריך להמיר.)
- **תאריכים תמיד בפורמט `YYYY-MM-DD`** (למשל `2026-11-13`), בלי שעה. כך גם בשליחה וגם בתשובות.
- פרמטרים בכתובת (Query): שולחים רק את מה שנבחר. לא לשלוח פרמטרים ריקים.

---

## 2. התחברות (Authentication)

### איך זה עובד
1. המשתמש נרשם (`POST /api/auth/register`) או מתחבר (`POST /api/auth/login`).
2. השרת מחזיר **token** (JWT) ואת פרטי המשתמש.
3. שומרים את ה־token בצד הלקוח (למשל ב־localStorage), כדי שהמשתמש יישאר מחובר גם אחרי רענון.
4. **בכל בקשה לנתיב מוגן** שולחים את הכותרת:
   ```
   Authorization: Bearer <token>
   ```
5. ה־token תקף **24 שעות**. אחרי זה השרת מחזיר 401 עם הקוד `TOKEN_EXPIRED`, וצריך להתחבר מחדש.

### התנתקות
אין Endpoint להתנתקות: פשוט מוחקים את ה־token השמור אצלך.

### אחרי רענון הדף
אם יש token שמור, קוראים ל־`GET /api/auth/me` כדי לקבל את פרטי המשתמש המעודכנים, ואם יש לו דירה (`hasApartment`). אם חזר 401, ה־token לא בתוקף: מוחקים אותו.

### תפקידים
| `role` | מי | מה רואים בתפריט |
|---|---|---|
| (אין token) | אורח | חיפוש, פרטי דירה, הרשמה, התחברות, תקנון |
| `USER` | משתמש רגיל | + הדירה שלי, לוח התפוסה שלי, ההחלפות שלי, פרופיל |
| `ADMIN` | מנהל | + ניהול דירות, ערים, משתמשים, כל ההחלפות. **למנהל אין דירה** והוא לא שולח הצעות |

ההסתרה בתפריט היא רק לנוחות. השרת בודק הרשאות בכל בקשה.

---

## 3. שגיאות

כל שגיאה חוזרת באותו מבנה:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "הנתונים שנשלחו אינם תקינים",
    "details": [
      { "field": "endDate", "message": "הטווח המקסימלי הוא 14 ימים" }
    ]
  }
}
```
- `message` בעברית, ואפשר להציג אותו למשתמש כמו שהוא.
- `code` קבוע, ומתאים לבדיקה בקוד (למשל להחליט לאן לנווט).
- `details` מופיע רק בשגיאות 400 של טפסים: הודעה לכל שדה, לפי שם השדה. מתאים להצגה ליד השדה בטופס.

| קוד HTTP | מתי | מה מומלץ לעשות |
|---|---|---|
| 400 | נתונים לא תקינים | להציג את `details` ליד השדות |
| 401 | אין token, token לא תקין או פג תוקף, או מייל/סיסמה שגויים | למחוק את ה־token ולהעביר להתחברות (חוץ ממסך ההתחברות עצמו, שם מציגים את ההודעה) |
| 403 | מחובר, אבל אין הרשאה | להציג את ההודעה, בלי לנתק |
| 404 | לא נמצא, או שאין לך גישה | להציג "לא נמצא" |
| 409 | התנגשות (תאריכים תפוסים, מייל קיים, מצב שהשתנה) | להציג את ההודעה במקום הפעולה |
| 500 | תקלה בשרת | הודעה כללית |
| (אין תשובה) | השרת לא זמין, או "מתעורר" בענן | הודעה כללית, ואפשר לנסות שוב |

כדאי לטפל בשגיאות במקום מרכזי אחד, שדרכו עוברות כל הבקשות.

### רשימת קודי השגיאה
| code | HTTP | משמעות |
|---|---|---|
| `VALIDATION_ERROR` | 400 | שדות לא תקינים, ראו `details` |
| `INVALID_JSON` | 400 | גוף הבקשה אינו JSON תקין |
| `CANNOT_OFFER_OWN_APARTMENT` | 400 | ניסיון להציע לדירה של עצמך |
| `AUTH_REQUIRED` | 401 | לא נשלח token |
| `INVALID_TOKEN` | 401 | token לא תקין |
| `TOKEN_EXPIRED` | 401 | פג תוקף ה־token |
| `INVALID_CREDENTIALS` | 401 | מייל או סיסמה שגויים |
| `FORBIDDEN` | 403 | פעולה שמותרת רק לתפקיד אחר |
| `ACTION_NOT_ALLOWED` | 403 | הצד הלא נכון בהחלפה (למשל השולח מנסה לאשר) |
| `NO_APARTMENT` | 403 / 404 | אין לך דירה (403 בשליחת הצעה, 404 ב"הדירה שלי") |
| `APARTMENT_HIDDEN` | 403 | הדירה שלך מוסתרת, ולכן אי אפשר לשלוח הצעות |
| `APARTMENT_BLOCKED` | 403 / 409 | הדירה חסומה על ידי מנהל |
| `APARTMENT_NOT_FOUND`, `SWAP_NOT_FOUND`, `CITY_NOT_FOUND`, `BLOCK_NOT_FOUND`, `ROUTE_NOT_FOUND` | 404 | לא נמצא |
| `EMAIL_TAKEN` | 409 | המייל כבר רשום |
| `APARTMENT_EXISTS` | 409 | כבר יש לך דירה |
| `DATES_UNAVAILABLE` | 409 | התאריכים תפוסים |
| `DUPLICATE_OFFER` | 409 | כבר שלחת הצעה ממתינה לאותה דירה בתאריכים חופפים |
| `INVALID_STATE` | 409 | מצב ההצעה לא מאפשר את הפעולה (למשל כבר נענתה) |
| `SWAP_EXPIRED` | 409 | תאריך ההתחלה עבר |
| `SWAP_STARTED` | 409 | אי אפשר לבטל החלפה שהתחילה |
| `CANCEL_REQUEST_EXISTS`, `NO_CANCEL_REQUEST` | 409 | כבר יש / אין בקשת ביטול פתוחה |
| `CITY_EXISTS`, `CITY_IN_USE` | 409 | עיר קיימת / יש בה דירות |
| `ALREADY_BLOCKED`, `NOT_BLOCKED`, `BLOCK_IN_PAST` | 409 | מצב חסימה |
| `CONFLICT_RETRY` | 409 | התנגשות רגעית, לנסות שוב |
| `INTERNAL_ERROR` | 500 | תקלה בשרת |

---

## 4. מבני הנתונים

### User
```json
{ "id": 2, "fullName": "משפחת כהן", "email": "cohen@example.com", "phone": "0501234567", "role": "USER", "createdAt": "2026-10-21T18:30:00.000Z" }
```
`phone` יכול להיות `null`.

### City
```json
{ "id": 1, "name": "ירושלים", "isActive": true }
```

### Apartment (כפי שכל גולש רואה)
```json
{
  "id": 1,
  "title": "דירת 4 חדרים מרווחת ליד בית הכנסת",
  "city": { "id": 1, "name": "ירושלים" },
  "neighborhood": "רמות",
  "rooms": 4.5,
  "beds": 7,
  "floor": 2,
  "hasElevator": true,
  "hasPlata": true,
  "hasUrn": true,
  "hasShabbatClock": true,
  "hasEruv": true,
  "hasGenerator": false,
  "description": "דירה מרווחת ומוארת...",
  "createdAt": "2026-10-21T18:30:00.000Z",
  "updatedAt": "2026-10-21T18:30:00.000Z"
}
```
**בעל הדירה והמנהל** מקבלים בנוסף:
```json
{ "status": "ACTIVE", "isBlocked": false, "blockReason": null, "blockedAt": null }
```
`status`: `ACTIVE` (פעילה) או `HIDDEN` (מוסתרת). `blockReason` מוצג לבעל הדירה כשהיא חסומה.

### ApartmentSummary (בתוך הצעות)
```json
{ "id": 1, "title": "...", "city": { "id": 1, "name": "ירושלים" }, "neighborhood": "רמות", "rooms": 4, "beds": 7 }
```

### סטטוסים של הצעה (`status`)
| ערך | להצגה |
|---|---|
| `PENDING` | ממתינה |
| `APPROVED` | מאושרת |
| `REJECTED` | נדחתה |
| `AUTO_REJECTED` | נדחתה אוטומטית |
| `WITHDRAWN` | נמשכה |
| `CANCELLED` | בוטלה בהסכמה |
| `EXPIRED` | פג תוקף |

### Swap (פרטי החלפה מלאים)
```json
{
  "id": 2,
  "status": "PENDING",
  "startDate": "2026-11-20",
  "endDate": "2026-11-22",
  "message": "נשמח לשבת בירושלים.",
  "direction": "RECEIVED",
  "senderApartment": { "...": "ApartmentSummary" },
  "receiverApartment": { "...": "ApartmentSummary" },
  "cancelRequest": null,
  "otherParty": { "fullName": "משפחת פרידמן", "email": "friedman@example.com", "phone": "0533334444" },
  "allowedActions": {
    "canApprove": true,
    "canReject": true,
    "canWithdraw": false,
    "canRequestCancel": false,
    "canApproveCancel": false,
    "canRejectCancel": false,
    "canWithdrawCancelRequest": false
  },
  "createdAt": "2026-10-21T18:30:00.000Z",
  "respondedAt": null,
  "cancelledAt": null
}
```
- `direction`: `SENT` (שלחתי) או `RECEIVED` (קיבלתי).
- `otherParty`: פרטי הקשר של הצד השני. מגיע **רק** כשההצעה ממתינה או מאושרת, אחרת `null`.
- `cancelRequest`: `null`, או:
  ```json
  { "isOpen": true, "requestedById": 2, "requestedByMe": false, "reason": "חלה במשפחה", "requestedAt": "..." }
  ```
- **`allowedActions`: להציג רק את הכפתורים שהערך שלהם `true`.** כך אין צורך לחשב בצד ה־React מי רשאי לעשות מה.

### רשימה עם חלוקה לעמודים
כל הרשימות (חוץ מערים וחסימות) חוזרות כך:
```json
{ "items": [ ... ], "page": 1, "pageSize": 12, "total": 37, "totalPages": 4 }
```
בבקשה: `page` (ברירת מחדל 1), `pageSize` (ברירת מחדל 12, מקסימום 50).

---

## 5. מסך אחר מסך

### מסך 1: חיפוש דירות (דף הבית) — ציבורי
**טעינת רשימת הערים לסינון:** `GET /api/cities` ← מערך של City.

**חיפוש:** `GET /api/apartments?...`

| פרמטר | ערך | הערה |
|---|---|---|
| `cityId` | מספר | |
| `from`, `to` | `YYYY-MM-DD` | **שניהם יחד או אף אחד.** מחזיר רק דירות פנויות בכל הטווח. לא בעבר, עד 6 חודשים, עד 14 ימים |
| `minBeds` | 1–30 | |
| `minRooms` | 1–20 | |
| `hasElevator`, `hasPlata`, `hasUrn`, `hasShabbatClock`, `hasEruv`, `hasGenerator` | `true` | שולחים רק את מה שסומן. `true` = חובה שיהיה |
| `q` | טקסט עד 100 תווים | חיפוש בכותרת, בשכונה ובתיאור |
| `sort` | `newest` / `beds` | ברירת מחדל `newest` |
| `page`, `pageSize` | | |

דוגמה: `GET /api/apartments?cityId=1&from=2026-11-13&to=2026-11-15&minBeds=6&hasPlata=true&sort=beds&page=1`

**תשובה:** רשימה עם חלוקה לעמודים של Apartment. אם המשתמש מחובר, כדאי לשלוח token: אז הדירה שלו לא תופיע בתוצאות.

### מסך 2: פרטי דירה — ציבורי
- `GET /api/apartments/{id}` ← `{ "apartment": Apartment }`. מוסתרת או חסומה: 404.
- `GET /api/apartments/{id}/calendar` ← לוח תפוסה. בלי פרמטרים: מהיום ועד 6 חודשים, בבקשה אחת.
  ```json
  {
    "apartmentId": 1,
    "from": "2026-10-21",
    "to": "2027-04-21",
    "busyRanges": [
      { "startDate": "2026-11-04", "endDate": "2026-11-06", "reason": "SWAP" },
      { "startDate": "2026-11-13", "endDate": "2026-11-15", "reason": "BLOCKED" }
    ]
  }
  ```
  יום תפוס = יום שנמצא בין `startDate` ל־`endDate` (כולל) של אחד הטווחים. טווח יכול להתחיל לפני `from`.
  טיפ: תאריכים בפורמט `YYYY-MM-DD` אפשר להשוות כטקסט רגיל (`"2026-11-04" <= "2026-11-05"`), בלי להמיר ל־Date.
- **כפתור "שלח הצעת החלפה":**
  - אורח ← להעביר להתחברות.
  - מחובר בלי דירה (`hasApartment: false`) ← הודעה עם הפניה ל"הדירה שלי".
  - אם זו הדירה של המשתמש עצמו (ה־`id` זהה לדירה שחוזרת מ־`GET /api/my/apartment`) ← לא להציג כפתור.

### מסך 3: הרשמה — ציבורי
`POST /api/auth/register`
```json
{ "fullName": "משפחת כהן", "email": "cohen@example.com", "password": "Secret123", "phone": "050-1234567", "acceptTerms": true }
```
| שדה | חובה | כללים |
|---|---|---|
| `fullName` | כן | 2–60 תווים |
| `email` | כן | מייל תקין |
| `password` | כן | 8–72 תווים, לפחות אות וספרה |
| `phone` | לא | 9–15 ספרות; מותר `+`, מקפים ורווחים |
| `acceptTerms` | כן | חייב להיות `true` |

(שדה "אימות סיסמה" בודקים רק בטופס, ולא שולחים לשרת.)
**תשובה 201:** `{ "token": "...", "expiresIn": 86400, "user": User }` ← המשתמש מחובר מיד.
**שגיאות:** 400 (שדות), 409 `EMAIL_TAKEN`.

### מסך 4: התחברות — ציבורי
`POST /api/auth/login` עם `{ "email": "...", "password": "..." }`
**תשובה 200:** כמו בהרשמה. **שגיאה:** 401 `INVALID_CREDENTIALS`.

### מסך 5: תקנון וצור קשר — ציבורי
`GET /api/site-info` ← `{ "adminContactEmail": "...", "termsVersion": "1", "termsText": "..." }`
`termsText` מחולק לשורות בתו `\n`. את `adminContactEmail` משתמשים גם בתזכורות בטפסים.

### מסך 6: הדירה שלי — משתמש
- `GET /api/my/apartment` ← `{ "apartment": Apartment + status }`. אם עדיין אין: 404 `NO_APARTMENT` ← להציג טופס פרסום.
- **פרסום:** `POST /api/my/apartment` ← 201. **עריכה:** `PUT /api/my/apartment` ← 200. אותו גוף בשניהם (בעריכה שולחים את כל השדות):
  ```json
  {
    "title": "דירת 4 חדרים מרווחת ליד בית הכנסת",
    "cityId": 1,
    "neighborhood": "רמות",
    "rooms": 4.5,
    "beds": 7,
    "floor": 2,
    "hasElevator": true,
    "hasPlata": true,
    "hasUrn": true,
    "hasShabbatClock": true,
    "hasEruv": true,
    "hasGenerator": false,
    "description": "דירה מרווחת ומוארת, שתי דקות הליכה מבית הכנסת."
  }
  ```
  | שדה | חובה | כללים |
  |---|---|---|
  | `title` | כן | 5–100 תווים |
  | `cityId` | כן | עיר פעילה מ־`GET /api/cities` |
  | `neighborhood` | כן | 2–60 תווים |
  | `rooms` | כן | 1–20, בקפיצות של 0.5 |
  | `beds` | כן | מספר שלם 1–30 |
  | `floor` | כן | מספר שלם, 3- עד 60 |
  | `has...` (6 שדות) | לא | `true`/`false`, ברירת מחדל `false` |
  | `description` | כן | 10–2000 תווים |
- **פעילה / מוסתרת:** `PATCH /api/my/apartment/status` עם `{ "status": "HIDDEN" }` או `"ACTIVE"`. דירה חסומה: 403 `APARTMENT_BLOCKED`.
- **דירה חסומה** (`isBlocked: true`): להציג את `blockReason` ואת המייל מ־`site-info`, ולנטרל את מתג הסטטוס.

### מסך 7: לוח התפוסה שלי וחסימת תאריכים — משתמש
- `GET /api/apartments/{myApartmentId}/calendar` עם token ← כמו במסך 2, ובנוסף:
  ```json
  "pendingRanges": [ { "swapId": 5, "startDate": "2026-11-20", "endDate": "2026-11-22", "direction": "RECEIVED" } ]
  ```
  (הצעות ממתינות, לבעל הדירה בלבד. מתאים לצבע אחר בלוח.)
- `GET /api/my/apartment/blocked-dates` ← `[{ "id": 1, "startDate": "...", "endDate": "...", "note": "אורחים" }]` (נוכחיות ועתידיות).
- **הוספה:** `POST /api/my/apartment/blocked-dates` עם `{ "startDate": "...", "endDate": "...", "note": "..." }`
  - `note` לא חובה, עד 100 תווים. עד 14 ימים, לא בעבר, עד 6 חודשים.
  - **תשובה 201:** `{ "blockedDate": {...}, "autoRejectedOffers": 1 }`. הצעות ממתינות על התאריכים האלה נדחות אוטומטית. אם המספר גדול מ־0, כדאי להודיע למשתמש.
  - 409 `DATES_UNAVAILABLE` אם חופף להחלפה מאושרת או לחסימה קיימת.
- **מחיקה:** `DELETE /api/my/apartment/blocked-dates/{id}` ← 204 (בלי גוף).

### מסך 8: ההחלפות שלי — משתמש
`GET /api/swaps?box=received` (קיבלתי) או `box=sent` (שלחתי), אופציונלי `status=PENDING` וכו'.
כל פריט:
```json
{
  "id": 2, "status": "PENDING", "startDate": "2026-11-20", "endDate": "2026-11-22",
  "direction": "RECEIVED", "otherApartment": { "...": "ApartmentSummary" },
  "hasOpenCancelRequest": false, "cancelRequestedByMe": false, "createdAt": "..."
}
```
`hasOpenCancelRequest` ו־`!cancelRequestedByMe` = הצד השני ביקש לבטל ומחכה להחלטה שלך. כדאי לסמן בבולט.

### מסך 9: פרטי החלפה — צד בהחלפה
`GET /api/swaps/{id}` ← `{ "swap": Swap }` (מבנה מלא בסעיף 4).
**הכפתורים, לפי `allowedActions`:**
| כפתור | מופיע כש־ | בקשה | גוף |
|---|---|---|---|
| אשר | `canApprove` | `POST /api/swaps/{id}/approve` | — |
| דחה | `canReject` | `POST /api/swaps/{id}/reject` | — |
| משוך הצעה | `canWithdraw` | `POST /api/swaps/{id}/withdraw` | — |
| בקש ביטול | `canRequestCancel` | `POST /api/swaps/{id}/cancel-request` | `{ "reason": "..." }` (לא חובה, עד 300) |
| הסכם לביטול | `canApproveCancel` | `POST /api/swaps/{id}/cancel-request/approve` | — |
| סרב לביטול | `canRejectCancel` | `POST /api/swaps/{id}/cancel-request/reject` | — |
| משוך בקשת ביטול | `canWithdrawCancelRequest` | `POST /api/swaps/{id}/cancel-request/withdraw` | — |

כל הפעולות מחזירות `{ "swap": Swap }` מעודכן, כך שאפשר להציג את התוצאה מיד. אחרי פעולה כדאי לרענן גם את רשימת ההחלפות ואת הלוח.
מה קורה באישור: התאריכים נחסמים בשתי הדירות, וכל ההצעות הממתינות האחרות שחופפות (של שתי הדירות) הופכות ל־`AUTO_REJECTED`.
**שגיאות אפשריות:** 409 `INVALID_STATE` (המצב השתנה בינתיים, למשל ההצעה כבר נדחתה אוטומטית), 409 `DATES_UNAVAILABLE`, 409 `SWAP_STARTED`.

### מסך 10: חלון שליחת הצעה — משתמש
`POST /api/swaps`
```json
{ "receiverApartmentId": 1, "startDate": "2026-11-20", "endDate": "2026-11-22", "message": "נשמח לשבת בירושלים." }
```
| שדה | חובה | כללים |
|---|---|---|
| `receiverApartmentId` | כן | מזהה הדירה המבוקשת |
| `startDate`, `endDate` | כן | לא בעבר, עד 6 חודשים, עד 14 ימים, סיום לא לפני התחלה |
| `message` | לא | עד 500 תווים |

את הדירה שלך לא שולחים: השרת לוקח אותה לפי ה־token.
**תשובה 201:** `{ "swap": Swap }`. **שגיאות:** 403 `NO_APARTMENT` / `APARTMENT_HIDDEN` / `APARTMENT_BLOCKED`, 404 (הדירה המבוקשת לא זמינה), 409 `DATES_UNAVAILABLE` / `DUPLICATE_OFFER`. בשגיאה החלון נשאר פתוח עם ההודעה.

### מסך 11: הפרופיל שלי — מחובר
`PATCH /api/auth/me` עם לפחות אחד מ־`{ "fullName": "...", "phone": "..." }`. `phone: null` מוחק את הטלפון. המייל לא ניתן לשינוי.
**תשובה:** `{ "user": User }`.

### מסך 12: ניהול דירות — מנהל
`GET /api/admin/apartments?cityId=&status=ACTIVE|HIDDEN&isBlocked=true|false&ownerEmail=&ownerPhone=&page=`
- `ownerEmail`, `ownerPhone`: חיפוש חלקי. בטלפון, מקפים ורווחים לא משנים.
- כל פריט: Apartment + status + `owner: { id, fullName, email, phone }`.

**חסימה:** `POST /api/admin/apartments/{id}/block` עם `{ "reason": "..." }` (חובה, 3–300 תווים) ← `{ "apartment": ..., "autoRejectedOffers": 2 }`.
**שחרור:** `POST /api/admin/apartments/{id}/unblock` ← `{ "apartment": ... }`.

### מסך 13: ניהול ערים — מנהל
| פעולה | בקשה | גוף |
|---|---|---|
| רשימה (כולל מושבתות) | `GET /api/cities?includeInactive=true` | — |
| הוספה | `POST /api/cities` | `{ "name": "אלעד" }` (2–40) ← 201 `{ "city": City }` |
| שינוי שם / הפעלה / השבתה | `PATCH /api/cities/{id}` | `{ "name": "...", "isActive": false }` (לפחות אחד) |
| מחיקה | `DELETE /api/cities/{id}` | ← 204. אם יש דירות בעיר: 409 `CITY_IN_USE` (אפשר להשבית במקום) |

### מסך 14: משתמשים — מנהל
`GET /api/admin/users?name=&email=&phone=&page=` (חיפוש חלקי)
כל פריט: User + `apartment: { id, title, status, isBlocked }` או `null`.

### מסך 15: כל ההחלפות — מנהל
`GET /api/admin/swaps?apartmentId=&status=&page=`
כל פריט: `id, status, startDate, endDate, senderApartment, receiverApartment` (כל דירה עם `owner: { id, fullName }`), `hasOpenCancelRequest`, `createdAt`.
לפרטים מלאים: `GET /api/swaps/{id}` (למנהל מגיע גם `owners`, בלי פרטי קשר).

---

## 6. טבלת הרשאות

| פעולה | אורח | משתמש | מנהל |
|---|---|---|---|
| חיפוש, פרטי דירה, לוח תפוסה, ערים, תקנון | V | V | V |
| הרשמה, התחברות | V | — | — |
| פרופיל (`/api/auth/me`) | X (401) | V | V |
| הדירה שלי, חסימות (`/api/my/...`) | X (401) | V | X (403) |
| שליחת הצעה, רשימת ההחלפות שלי, פעולות על הצעות | X (401) | V | X (403) |
| פרטי החלפה (`GET /api/swaps/{id}`) | X (401) | רק צד בהחלפה (אחרת 404) | V |
| ניהול ערים (`POST/PATCH/DELETE /api/cities`) | X (401) | X (403) | V |
| כל נתיבי `/api/admin/...` | X (401) | X (403) | V |

---

## 7. תזכורות לחוויית משתמש (מתוך כללי השרת)

- **תאריכים:** בשדות התאריך להגדיר מינימום = היום ומקסימום = היום + 6 חודשים; תאריך הסיום לא לפני ההתחלה; עד 14 ימים.
- **לוח:** לבקש את כל 6 החודשים פעם אחת כשנכנסים למסך, ולהציג חודש אחד בכל פעם.
- **כפתורים:** רק לפי `allowedActions`. לפני אישור החלפה, בקשת ביטול ואישור ביטול: חלון "האם אתה בטוח?", עם תזכורת שזו התחייבות.
- **שליחה כפולה:** לנטרל את כפתור השליחה בזמן שהבקשה בדרך.
- **שרת בענן:** הבקשה הראשונה אחרי "שינה" יכולה לקחת בערך דקה. כדאי להציג מצב טעינה ברור.
