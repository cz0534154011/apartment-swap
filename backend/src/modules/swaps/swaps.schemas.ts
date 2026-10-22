import { paginationSchema, ymdSchema, z } from '../../utils/validation.js';

export const SWAP_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'AUTO_REJECTED',
  'WITHDRAWN',
  'CANCELLED',
  'EXPIRED',
] as const;

export const createSwapSchema = z.object({
  receiverApartmentId: z.number().int().positive(),
  startDate: ymdSchema,
  endDate: ymdSchema,
  message: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v ? v : null)),
});
export type CreateSwapInput = z.infer<typeof createSwapSchema>;

export const listSwapsQuerySchema = paginationSchema.extend({
  box: z.enum(['received', 'sent', 'all']).default('all'),
  status: z.enum(SWAP_STATUSES).optional(),
});
export type ListSwapsQuery = z.infer<typeof listSwapsQuerySchema>;

export const cancelRequestSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((v) => (v ? v : null)),
});
