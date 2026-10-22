import { z, optionalPhoneSchema } from '../../utils/validation.js';

const passwordSchema = z
  .string()
  .min(8)
  .max(72)
  .refine((v) => /[A-Za-z֐-׿]/.test(v) && /\d/.test(v), {
    message: 'הסיסמה חייבת לכלול לפחות אות אחת וספרה אחת',
  });

const emailSchema = z.string().trim().toLowerCase().email().max(254);
const fullNameSchema = z.string().trim().min(2).max(60);

export const registerSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: optionalPhoneSchema.optional(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'יש לאשר את התקנון כדי להירשם' }),
  }),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1),
  password: z.string().min(1),
});

export const updateMeSchema = z
  .object({
    fullName: fullNameSchema.optional(),
    // null או מחרוזת ריקה מוחקים את הטלפון
    phone: z.union([optionalPhoneSchema, z.null()]).optional(),
  })
  .refine((v) => v.fullName !== undefined || v.phone !== undefined, {
    message: 'יש לשלוח לפחות שדה אחד לעדכון: fullName או phone',
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateMeInput = z.infer<typeof updateMeSchema>;
