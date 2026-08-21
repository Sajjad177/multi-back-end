import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import Category from '../category/category.model';
import {
  CategorySuggestionSource,
  CategorySuggestionStatus,
  ICategorySuggestion,
} from './categorySuggestion.interface';
import CategorySuggestion from './categorySuggestion.model';
import { User } from '../user/user.model';

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

const categorySuggestionService = {
  suggestCategory,
};

export default categorySuggestionService;
