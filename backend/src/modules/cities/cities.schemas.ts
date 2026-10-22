import { queryBoolean, z } from '../../utils/validation.js';

const nameSchema = z.string().trim().min(2).max(40);

export const cityCreateSchema = z.object({ name: nameSchema });

export const cityUpdateSchema = z
  .object({ name: nameSchema.optional(), isActive: z.boolean().optional() })
  .refine((v) => v.name !== undefined || v.isActive !== undefined, {
    message: 'יש לשלוח לפחות שדה אחד לעדכון: name או isActive',
  });

export const cityListQuerySchema = z.object({ includeInactive: queryBoolean });
