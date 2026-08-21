import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import Category from '../category/category.model';
import {
  CategorySuggestionAction,
  CategorySuggestionSource,
  CategorySuggestionStatus,
  ICategorySuggestion,
  IReviewCategorySuggestion,
} from './categorySuggestion.interface';
import CategorySuggestion from './categorySuggestion.model';
import { User } from '../user/user.model';
import mongoose from 'mongoose';
import slugify from 'slugify';

const suggestCategory = async (payload: ICategorySuggestion, email: string) => {
  const { name, parentId, description } = payload;

  if (parentId) {
    const parentCategory = await Category.findById(parentId);

    if (!parentCategory) {
      throw new AppError('Parent category is not found.', StatusCodes.NOT_FOUND);
    }

    if (!parentCategory.isActive) {
      throw new AppError('Parent category is inactive.', StatusCodes.BAD_REQUEST);
    }
  }

  const user = await User.isUserExistByEmail(email);
  if (!user) {
    throw new AppError('Your account is not found', StatusCodes.NOT_FOUND);
  }

  /*
   * Check if category already exists
   */
  const existingCategory = await Category.findOne({
    name: {
      $regex: `^${name.trim()}$`,
      $options: 'i',
    },
    parentId: parentId || null,
  });

  if (existingCategory) {
    throw new AppError('This category already exists.', StatusCodes.CONFLICT);
  }

  /*
   * Prevent duplicate pending requests
   */
  const existingSuggestion = await CategorySuggestion.findOne({
    name: {
      $regex: `^${name.trim()}$`,
      $options: 'i',
    },

    parentId: parentId || null,

    status: CategorySuggestionStatus.PENDING,
  });

  if (existingSuggestion) {
    throw new AppError('This category is already pending for approval.', StatusCodes.CONFLICT);
  }

  return CategorySuggestion.create({
    name: name.trim(),
    parentId: parentId || null,
    description: description?.trim(),
    status: CategorySuggestionStatus.PENDING,
    source: CategorySuggestionSource.MANUAL,
    suggestedBy: user._id,
  });
};

const reviewCategorySuggestion = async (
  suggestionId: string,
  payload: IReviewCategorySuggestion,
) => {
  if (!mongoose.Types.ObjectId.isValid(suggestionId)) {
    throw new AppError('Invalid suggestion ID.', StatusCodes.BAD_REQUEST);
  }

  const suggestion = await CategorySuggestion.findById(suggestionId);

  if (!suggestion) {
    throw new AppError('Category suggestion is not found.', StatusCodes.NOT_FOUND);
  }

  if (suggestion.status !== CategorySuggestionStatus.PENDING) {
    throw new AppError(
      'This category suggestion has already been reviewed.',
      StatusCodes.BAD_REQUEST,
    );
  }

  const { action, name, parentId, description, mappedCategoryId, adminNote } = payload;

  if (action === CategorySuggestionAction.REJECT) {
    suggestion.status = CategorySuggestionStatus.REJECTED;
    suggestion.adminNote = adminNote;
    suggestion.reviewedAt = new Date();
    await suggestion.save();
    return suggestion;
  }

  if (action === CategorySuggestionAction.MAP) {
    if (!mappedCategoryId) {
      throw new AppError('Mapped category ID is required.', StatusCodes.BAD_REQUEST);
    }

    if (!mongoose.Types.ObjectId.isValid(mappedCategoryId)) {
      throw new AppError('Invalid mapped category ID.', StatusCodes.BAD_REQUEST);
    }

    const existingCategory = await Category.findById(mappedCategoryId);
    if (!existingCategory) {
      throw new AppError('Mapped category is not found.', StatusCodes.NOT_FOUND);
    }

    if (!existingCategory.isActive) {
      throw new AppError('Cannot map to an inactive category.', StatusCodes.BAD_REQUEST);
    }

    suggestion.status = CategorySuggestionStatus.MAPPED;
    suggestion.mappedCategoryId = existingCategory._id;
    suggestion.adminNote = adminNote;
    suggestion.reviewedAt = new Date();
    await suggestion.save();
    return suggestion;
  }

  const finalName = name?.trim() || suggestion.name;
  const finalParentId = parentId !== undefined ? parentId : suggestion.parentId;
  const finalDescription = description !== undefined ? description.trim() : suggestion.description;

  if (finalParentId) {
    if (!mongoose.Types.ObjectId.isValid(finalParentId.toString())) {
      throw new AppError('Invalid parent category ID.', StatusCodes.BAD_REQUEST);
    }

    const parentCategory = await Category.findById(finalParentId);
    if (!parentCategory) {
      throw new AppError('Parent category is not found.', StatusCodes.NOT_FOUND);
    }

    if (!parentCategory.isActive) {
      throw new AppError('Parent category is inactive.', StatusCodes.BAD_REQUEST);
    }
  }

  const existingCategory = await Category.findOne({
    name: {
      $regex: `^${finalName}$`,
      $options: 'i',
    },

    parentId: finalParentId || null,
  });

  if (existingCategory) {
    throw new AppError('This category already exists.', StatusCodes.CONFLICT);
  }

  let slug = slugify(finalName, {
    lower: true,
    strict: true,
    trim: true,
  });

  const existingSlug = await Category.findOne({
    slug,
  });

  if (existingSlug) {
    slug = `${slug}-${Date.now()}`;
  }

  const category = await Category.create({
    name: finalName,
    slug,
    parentId: finalParentId || null,
    description: finalDescription,
    isActive: true,
  });

  suggestion.status = CategorySuggestionStatus.APPROVED;
  suggestion.mappedCategoryId = category._id;
  suggestion.adminNote = adminNote;
  suggestion.reviewedAt = new Date();
  await suggestion.save();

  return {
    suggestion,
    category,
  };
};

const categorySuggestionService = {
  suggestCategory,
  reviewCategorySuggestion,
};

export default categorySuggestionService;
