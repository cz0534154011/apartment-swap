import { z, ZodIssueCode, type ZodErrorMap } from 'zod';
import { isValidYmd } from './dates.js';

/**
 * הודעות שגיאה בעברית לכל בדיקות ה-Zod במערכת.
 */
const hebrewErrorMap: ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === 'undefined' || issue.received === 'null') return { message: 'שדה חובה' };
      if (issue.expected === 'number' || issue.expected === 'integer') return { message: 'יש להזין מספר' };
      if (issue.expected === 'boolean') return { message: 'יש להזין true או false' };
      if (issue.expected === 'string') return { message: 'יש להזין טקסט' };
      return { message: 'סוג ערך לא תקין' };
    case ZodIssueCode.too_small:
      if (issue.type === 'string') {
        return { message: issue.minimum === 1 ? 'שדה חובה' : `יש להזין לפחות ${issue.minimum} תווים` };
      }
      if (issue.type === 'number') return { message: `הערך המינימלי הוא ${issue.minimum}` };
      return { message: 'הערך קטן מדי' };
    case ZodIssueCode.too_big:
      if (issue.type === 'string') return { message: `ניתן להזין עד ${issue.maximum} תווים` };
      if (issue.type === 'number') return { message: `הערך המקסימלי הוא ${issue.maximum}` };
      return { message: 'הערך גדול מדי' };
    case ZodIssueCode.invalid_string:
      if (issue.validation === 'email') return { message: 'כתובת מייל לא תקינה' };
      return { message: 'פורמט לא תקין' };
    case ZodIssueCode.invalid_enum_value:
      return { message: `ערך לא תקין. ערכים אפשריים: ${issue.options.join(', ')}` };
    case ZodIssueCode.not_multiple_of:
      return { message: `הערך חייב להיות בקפיצות של ${issue.multipleOf}` };
    case ZodIssueCode.invalid_literal:
      return { message: 'ערך לא תקין' };
    case ZodIssueCode.not_finite:
      return { message: 'יש להזין מספר' };
    default:
      return { message: ctx.defaultError };
  }
};

z.setErrorMap(hebrewErrorMap);

/** תאריך בפורמט YYYY-MM-DD */
export const ymdSchema = z
  .string({ required_error: 'שדה חובה' })
  .refine(isValidYmd, { message: 'תאריך לא תקין. הפורמט הנדרש: YYYY-MM-DD' });

/** מזהה מספרי חיובי בכתובת, למשל /apartments/5 */
export const idParamSchema = z.object({
  id: z.coerce.number({ invalid_type_error: 'מזהה לא תקין' }).int('מזהה לא תקין').positive('מזהה לא תקין'),
});

/** ערך כן/לא שמגיע בכתובת: "true" או "false" */
export const queryBoolean = z
  .enum(['true', 'false'])
  .optional()
  .transform((v) => (v === undefined ? undefined : v === 'true'));

/** הסרת רווחים, מקפים, סוגריים ונקודות ממספר טלפון */
export function normalizePhone(value: string): string {
  return value.replace(/[\s\-().]/g, '');
}

export const PHONE_REGEX = /^\+?\d{9,15}$/;

/** טלפון אופציונלי: מחרוזת ריקה נחשבת "ללא טלפון" */
export const optionalPhoneSchema = z
  .string()
  .trim()
  .transform(normalizePhone)
  .refine((v) => v === '' || PHONE_REGEX.test(v), { message: 'מספר טלפון לא תקין (9 עד 15 ספרות)' })
  .transform((v) => (v === '' ? null : v));

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export { z };
