import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { ICategory, IUpdateCategory } from './category.interface';
import Category from './category.model';
import mongoose from 'mongoose';
import slugify from 'slugify';
import QueryBuilder from '../../helper/QueryBuilder';

const createNewCategory = async (
  payload: ICategory,
  file?: Express.Multer.File,
): Promise<ICategory> => {
  const { name, parentId, description } = payload;

  let parentCategory = null;

  if (parentId) {
    if (!mongoose.Types.ObjectId.isValid(parentId)) {
      throw new AppError('Invalid parent category ID', StatusCodes.BAD_REQUEST);
    }

    parentCategory = await Category.findById(parentId);

    if (!parentCategory) {
      throw new AppError('Parent category not found', StatusCodes.BAD_REQUEST);
    }

    if (!parentCategory.isActive) {
      throw new AppError(
        'Cannot create category under an inactive parent category',
        StatusCodes.CONFLICT,
      );
    }
  }

  const existingCategory = await Category.findOne({
    name: {
      $regex: `^${name}$`,
      $options: 'i',
    },
    parentId: parentId || null,
  });

  if (existingCategory) {
    throw new AppError(
      'Category already exists under this parent category',
      StatusCodes.BAD_REQUEST,
    );
  }

  let slug = slugify(name, {
    lower: true,
    strict: true,
    trim: true,
  });

  const existingSlug = await Category.findOne({ slug });
  if (existingSlug) {
    slug = `${slug}-${Date.now()}`;
  }

  let image:
    | {
        publicId: string;
        url: string;
      }
    | undefined;

  if (file) {
    const uploadResult = await uploadToCloudinary(file.path, 'categories');

    image = {
      publicId: uploadResult.public_id,
      url: uploadResult.secure_url,
    };
  }

  const category = await Category.create({
    name: name.trim(),
    slug,
    parentId: parentId || null,
    description: description?.trim(),
    image,
    isActive: true,
  });

  return category;
};

const getAllCategories = async (query: Record<string, unknown>) => {
  const searchableFields = ['name'];

  return new QueryBuilder(Category, query)
    .search(searchableFields)
    .filter(['searchTerm', 'sortBy', 'sortOrder', 'page', 'limit'])
    .sort()
    .paginate()
    .getPaginatedResult();
};

const getSingleCategories = async (categoryId: string) => {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new AppError('Invalid category ID.', StatusCodes.BAD_REQUEST);
  }

  const result = await Category.findById(categoryId).populate({
    path: 'parentId',
    select: 'name slug image isActive',
  });

  if (!result) {
    throw new AppError('Category is not found.', StatusCodes.NOT_FOUND);
  }

  return result;
};

const updateCategory = async (
  categoryId: string,
  payload: IUpdateCategory,
  file?: Express.Multer.File,
) => {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new AppError('Invalid category ID.', StatusCodes.BAD_REQUEST);
  }

  const category = await Category.findById(categoryId);
  if (!category) {
    throw new AppError('Category is not found.', StatusCodes.NOT_FOUND);
  }

  const { name, parentId, description } = payload;
  if (parentId && parentId.toString() === categoryId) {
    throw new AppError('A category cannot be its own parent.', StatusCodes.BAD_REQUEST);
  }

  if (parentId) {
    const parentCategory = await Category.findById(parentId);

    if (!parentCategory) {
      throw new AppError('Parent category is not found.', StatusCodes.NOT_FOUND);
    }

    if (!parentCategory.isActive) {
      throw new AppError('Cannot use an inactive category as parent.', StatusCodes.BAD_REQUEST);
    }

    let currentParentId = parentCategory.parentId;

    while (currentParentId) {
      if (currentParentId.toString() === categoryId) {
        throw new AppError(
          'Invalid parent category. Circular hierarchy detected.',
          StatusCodes.BAD_REQUEST,
        );
      }

      const parent = await Category.findById(currentParentId).select('parentId');
      if (!parent) break;
      currentParentId = parent.parentId;
    }
  }

  if (name) {
    const existingCategory = await Category.findOne({
      _id: { $ne: categoryId },

      name: {
        $regex: `^${name.trim()}$`,
        $options: 'i',
      },

      parentId: parentId ?? category.parentId ?? null,
    });

    if (existingCategory) {
      throw new AppError(
        'Category already exists under this parent category.',
        StatusCodes.CONFLICT,
      );
    }
  }

  const updateData: Partial<ICategory> = {};
  if (name) {
    updateData.name = name.trim();

    updateData.slug = slugify(name.trim(), {
      lower: true,
      strict: true,
      trim: true,
    });
  }

  if (parentId !== undefined) {
    updateData.parentId = parentId;
  }

  if (description !== undefined) {
    updateData.description = description.trim();
  }

  if (file) {
    const uploadResult = await uploadToCloudinary(file.path, 'categories');

    updateData.image = {
      publicId: uploadResult.public_id,
      url: uploadResult.secure_url,
    };
  }

  const result = await Category.findByIdAndUpdate(categoryId, updateData, {
    new: true,
    runValidators: true,
  });

  return result;
};

const toggleCategoryStatus = async (categoryId: string) => {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new AppError('Invalid category ID.', StatusCodes.BAD_REQUEST);
  }

  const category = await Category.findById(categoryId);
  if (!category) {
    throw new AppError('Category is not found.', StatusCodes.NOT_FOUND);
  }

  category.isActive = !category.isActive;
  await category.save();

  return category;
};

const categoryService = {
  createNewCategory,
  getAllCategories,
  getSingleCategories,
  updateCategory,
  toggleCategoryStatus,
};

export default categoryService;
