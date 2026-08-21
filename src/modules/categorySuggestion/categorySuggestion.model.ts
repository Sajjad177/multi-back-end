import { model, Schema } from 'mongoose';
import {
  CategorySuggestionSource,
  CategorySuggestionStatus,
  ICategorySuggestion,
} from './categorySuggestion.interface';

const categorySuggestionSchema = new Schema<ICategorySuggestion>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    status: {
      type: String,
      enum: Object.values(CategorySuggestionStatus),
      default: CategorySuggestionStatus.PENDING,
      index: true,
    },

    source: {
      type: String,
      enum: Object.values(CategorySuggestionSource),
      required: true,
    },

    suggestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    mappedCategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },

    adminNote: {
      type: String,
      trim: true,
    },

    reviewedAt: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const CategorySuggestion = model<ICategorySuggestion>(
  'CategorySuggestion',
  categorySuggestionSchema,
);

export default CategorySuggestion;
