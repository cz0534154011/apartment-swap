import { validationError, type FieldError } from './errors.js';

/**
 * כל התאריכים במערכת הם "יום בלבד" בפורמט YYYY-MM-DD.
 * במסד הנתונים הם נשמרים כ-DATE, וב-JavaScript מיוצגים כחצות UTC של אותו יום.
 */

export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_ZONE = 'Asia/Jerusalem';
export const MAX_RANGE_DAYS = 14;
export const WINDOW_MONTHS = 6;
const DAY_MS = 24 * 60 * 60 * 1000;

export function isValidYmd(value: string): boolean {
  if (!DATE_REGEX.test(value)) return false;
  const d = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** התאריך של היום לפי שעון ישראל */
export function todayYmd(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function ymdToDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

export function dateToYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(ymd: string, days: number): string {
  return dateToYmd(new Date(ymdToDate(ymd).getTime() + days * DAY_MS));
}

/** הוספת חודשים; אם היום לא קיים בחודש היעד (למשל 31), נלקח היום האחרון בחודש */
export function addMonths(ymd: string, months: number): string {
  const [y, m, d] = ymd.split('-').map(Number) as [number, number, number];
  const totalMonths = y * 12 + (m - 1) + months;
  const ty = Math.floor(totalMonths / 12);
  const tm = totalMonths % 12;
  const lastDay = new Date(Date.UTC(ty, tm + 1, 0)).getUTCDate();
  const td = Math.min(d, lastDay);
  return dateToYmd(new Date(Date.UTC(ty, tm, td)));
}

/** מספר הימים בטווח, כולל שני הקצוות */
export function daysInclusive(start: string, end: string): number {
  return Math.round((ymdToDate(end).getTime() - ymdToDate(start).getTime()) / DAY_MS) + 1;
}

/** התאריך האחרון שמותר לבחור: היום ועוד 6 חודשים */
export function maxAllowedYmd(today: string = todayYmd()): string {
  return addMonths(today, WINDOW_MONTHS);
}

interface RangeOptions {
  startField: string;
  endField: string;
  /** אורך מקסימלי בימים, או undefined ללא הגבלה */
  maxDays?: number;
}

/**
 * בדיקת כללי התאריכים של המערכת:
 * לא בעבר, לא מעבר ל-6 חודשים, סיום לא לפני התחלה, ואורך מקסימלי.
 * מחזירה שגיאת 400 עם פירוט לכל שדה.
 */
export function assertValidRange(start: string, end: string, opts: RangeOptions): void {
  const today = todayYmd();
  const max = maxAllowedYmd(today);
  const details: FieldError[] = [];

  if (start < today) {
    details.push({ field: opts.startField, message: 'תאריך ההתחלה לא יכול להיות בעבר' });
  }
  if (end > max) {
    details.push({ field: opts.endField, message: 'ניתן לבחור תאריכים עד 6 חודשים מהיום' });
  }
  if (end < start) {
    details.push({ field: opts.endField, message: 'תאריך הסיום חייב להיות באותו יום או אחרי תאריך ההתחלה' });
  } else if (opts.maxDays !== undefined && daysInclusive(start, end) > opts.maxDays) {
    details.push({ field: opts.endField, message: `הטווח המקסימלי הוא ${opts.maxDays} ימים` });
  }

  if (details.length > 0) throw validationError(details);
}
