import { z } from 'zod';
import { CategorySuggestionAction } from './categorySuggestion.interface';

const createCategorySuggestionValidationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    parentId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid parent category ID')
      .nullable()
      .optional(),
    description: z.string().trim().max(500).optional(),
  }),
});

const reviewCategorySuggestionValidationSchema = z.object({
  body: z.object({
    action: z.enum(Object.values(CategorySuggestionAction) as [string, ...string[]]),
    name: z.string().trim().min(2).max(100).optional(),
    parentId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid parent category ID')
      .nullable()
      .optional(),

    description: z.string().trim().max(500).optional(),

    mappedCategoryId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid mapped category ID')
      .optional(),

    adminNote: z.string().trim().max(500).optional(),
  }),
});

export const categorySuggestionValidation = {
  createCategorySuggestionValidationSchema,
  reviewCategorySuggestionValidationSchema,
};
