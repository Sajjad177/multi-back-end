import { z } from 'zod';

const userValidationSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(2).max(50),

    lastName: z.string().trim().min(2).max(50),
    email: z
      .string()
      .trim()
      .email()
      .transform((value) => value.toLowerCase()),
    password: z.string().min(8).max(72),
  }),
});

export const userValidation = {
  userValidationSchema,
};
