import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { ICategory } from './category.interface';
import Category from './category.model';
import mongoose from 'mongoose';
import slugify from 'slugify';

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

const getAllCategories = async () => {};

const categoryService = {
  createNewCategory,
  getAllCategories,
};

export default categoryService;
