import { paginationSchema, queryBoolean, ymdSchema, z } from '../../utils/validation.js';

/** שדות הדירה בפרסום ובעריכה. מספרים נשלחים כמספרים ב-JSON (לא כטקסט) */
export const apartmentInputSchema = z.object({
  title: z.string().trim().min(5).max(100),
  cityId: z.number().int().positive(),
  neighborhood: z.string().trim().min(2).max(60),
  rooms: z.number().min(1).max(20).multipleOf(0.5),
  beds: z.number().int().min(1).max(30),
  floor: z.number().int().min(-3).max(60),
  hasElevator: z.boolean().default(false),
  hasPlata: z.boolean().default(false),
  hasUrn: z.boolean().default(false),
  hasShabbatClock: z.boolean().default(false),
  hasEruv: z.boolean().default(false),
  hasGenerator: z.boolean().default(false),
  description: z.string().trim().min(10).max(2000),
});
export type ApartmentInput = z.infer<typeof apartmentInputSchema>;

export const apartmentStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'HIDDEN']),
});

export const AMENITY_KEYS = [
  'hasElevator',
  'hasPlata',
  'hasUrn',
  'hasShabbatClock',
  'hasEruv',
  'hasGenerator',
] as const;

export const searchQuerySchema = paginationSchema.extend({
  cityId: z.coerce.number().int().positive().optional(),
  from: ymdSchema.optional(),
  to: ymdSchema.optional(),
  minBeds: z.coerce.number().int().min(1).max(30).optional(),
  minRooms: z.coerce.number().min(1).max(20).optional(),
  hasElevator: queryBoolean,
  hasPlata: queryBoolean,
  hasUrn: queryBoolean,
  hasShabbatClock: queryBoolean,
  hasEruv: queryBoolean,
  hasGenerator: queryBoolean,
  q: z.string().trim().max(100).optional(),
  sort: z.enum(['newest', 'beds']).default('newest'),
});
export type SearchQuery = z.infer<typeof searchQuerySchema>;

export const calendarQuerySchema = z.object({
  from: ymdSchema.optional(),
  to: ymdSchema.optional(),
});

export const blockedDateInputSchema = z.object({
  startDate: ymdSchema,
  endDate: ymdSchema,
  note: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => (v ? v : null)),
});
export type BlockedDateInput = z.infer<typeof blockedDateInputSchema>;
