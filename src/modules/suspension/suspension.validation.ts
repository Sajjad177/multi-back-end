import { z } from 'zod';
import { SUSPENSION_ERROR_MESSAGES } from './suspension.constant';
import { SuspensionType } from './suspension.interface';

const suspendUserSchema = z
  .object({
    body: z.object({
      userId: z
        .string()
        .trim()
        .min(1, 'User ID is required')
        .refine((id) => /^[0-9a-fA-F]{24}$/.test(id), SUSPENSION_ERROR_MESSAGES.INVALID_USER_ID),

      type: z.enum([SuspensionType.TEMPORARY, SuspensionType.PERMANENT], {
        errorMap: () => ({ message: SUSPENSION_ERROR_MESSAGES.INVALID_SUSPENSION_TYPE }),
      }),

      reason: z
        .string()
        .trim()
        .min(1, SUSPENSION_ERROR_MESSAGES.REASON_REQUIRED)
        .min(3, 'Reason must be at least 3 characters')
        .max(500, 'Reason cannot exceed 500 characters'),

      description: z
        .string()
        .trim()
        .max(1000, 'Description cannot exceed 1000 characters')
        .optional(),

      expiresAt: z.string().datetime().optional(),
    }),
  })
  .superRefine(({ body }, ctx) => {
    // TEMPORARY suspension must have expiresAt
    if (body.type === SuspensionType.TEMPORARY) {
      if (!body.expiresAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['body', 'expiresAt'],
          message: SUSPENSION_ERROR_MESSAGES.TEMPORARY_REQUIRES_EXPIRES_AT,
        });
        return;
      }

      // expiresAt must be in the future
      const expiresAtDate = new Date(body.expiresAt);
      if (expiresAtDate <= new Date()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['body', 'expiresAt'],
          message: SUSPENSION_ERROR_MESSAGES.EXPIRES_AT_IN_PAST,
        });
      }
    }

    // PERMANENT suspension must not have expiresAt
    if (body.type === SuspensionType.PERMANENT) {
      if (body.expiresAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['body', 'expiresAt'],
          message: SUSPENSION_ERROR_MESSAGES.PERMANENT_NO_EXPIRES_AT,
        });
      }
    }
  });

export const suspensionValidation = {
  suspendUserSchema,
};
