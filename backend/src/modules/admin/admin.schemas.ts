import { normalizePhone, paginationSchema, queryBoolean, z } from '../../utils/validation.js';
import { SWAP_STATUSES } from '../swaps/swaps.schemas.js';

/** טקסט חיפוש חלקי; מחרוזת ריקה נחשבת "בלי סינון" */
const searchText = z
  .string()
  .trim()
  .max(100)
  .optional()
  .transform((v) => (v ? v : undefined));

/** טלפון לחיפוש: מקפים, רווחים וסוגריים לא משנים */
const phoneSearch = searchText.transform((v) => (v ? normalizePhone(v) || undefined : undefined));

export const adminApartmentsQuerySchema = paginationSchema.extend({
  cityId: z.coerce.number().int().positive().optional(),
  status: z.enum(['ACTIVE', 'HIDDEN']).optional(),
  isBlocked: queryBoolean,
  ownerEmail: searchText,
  ownerPhone: phoneSearch,
});

export const blockApartmentSchema = z.object({
  reason: z.string().trim().min(3).max(300),
});

export const adminUsersQuerySchema = paginationSchema.extend({
  name: searchText,
  email: searchText,
  phone: phoneSearch,
});

export const adminSwapsQuerySchema = paginationSchema.extend({
  apartmentId: z.coerce.number().int().positive().optional(),
  status: z.enum(SWAP_STATUSES).optional(),
});
