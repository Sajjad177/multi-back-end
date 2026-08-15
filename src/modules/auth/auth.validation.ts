import rateLimit from 'express-rate-limit';
import { z } from 'zod';

const authValidation = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email address.').trim().toLowerCase(),
    password: z.string().min(8, 'Password must be at least 6 characters long'),
  }),
});

const resendForgotOtpSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email('Invalid email address'),
  }),
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),

  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password is too long'),
});

export const authValidationSchema = {
  authValidation,
  resendForgotOtpSchema,
  changePasswordSchema,
};
