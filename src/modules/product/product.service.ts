import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { assertActiveSeller } from '../../helper/userEligibility';
import { IProduct, PRODUCT_STATUS } from './product.interface';
import Category from '../category/category.model';
import slugify from 'slugify';
import { Product } from './product.model';
import { uploadToCloudinary } from '../../utils/cloudinary';
import QueryBuilder from '../../helper/QueryBuilder';

const addNewProduct = async (payload: IProduct, files: Express.Multer.File[], sellerId: string) => {
  const { name, categoryId, description, unit } = payload;

  // 1. Validate seller
  await assertActiveSeller(sellerId);

  // 2. Validate product name
  if (!name?.trim()) {
    throw new AppError('Product name is required', StatusCodes.BAD_REQUEST);
  }

  // 3. Validate category
  const category = await Category.findOne({
    _id: categoryId,
    isActive: true,
  });

  if (!category) {
    throw new AppError('Active category not found', StatusCodes.NOT_FOUND);
  }

  // 4. Validate images
  if (!files || files.length === 0) {
    throw new AppError('At least one product image is required', StatusCodes.BAD_REQUEST);
  }

  if (files.length > 5) {
    throw new AppError('You can upload a maximum of 5 product images', StatusCodes.BAD_REQUEST);
  }

  // 5. Generate slug
  let slug = slugify(name.trim(), {
    lower: true,
    strict: true,
    trim: true,
  });

  // 6. Check duplicate slug
  const existingProduct = await Product.findOne({ slug });

  if (existingProduct) {
    slug = `${slug}-${Date.now()}`;
  }

  // 7. Upload images
  const uploadedImages = [];

  for (const file of files) {
    const uploadResult = await uploadToCloudinary(file.path, 'products');

    uploadedImages.push({
      publicId: uploadResult.public_id,
      url: uploadResult.secure_url,
    });
  }

  // 8. Create product
  const product = await Product.create({
    name: name.trim(),
    slug,
    categoryId,
    description: description?.trim(),
    images: uploadedImages,
    unit,
    status: PRODUCT_STATUS.ACTIVE,
  });

  return product;
};

const getAllProducts = (query: Record<string, unknown>) => {
  const searchableFields = ['name'];

  return new QueryBuilder(Product, query)
    .search(searchableFields)
    .filter(['searchTerm', 'sortBy', 'sortOrder', 'page', 'limit'])
    .sort()
    .paginate()
    .populate({
      path: 'categoryId',
      select: 'name slug parentId',
    })
    .getPaginatedResult();
};

const getSingleProduct = async (productId: string) => {
  const result = await Product.findById(productId);
  if (!result) {
    throw new AppError('Product is not found', StatusCodes.NOT_FOUND);
  }

  return result;
};

const updateProduct = async (
  productId: string,
  payload: Partial<IProduct>,
  files: Express.Multer.File[],
  sellerId: string,
) => {
  // 1. Validate seller
  await assertActiveSeller(sellerId);

  // 2. Validate product ID
  if (!productId) {
    throw new AppError('Product ID is required', StatusCodes.BAD_REQUEST);
  }

  // 3. Find product
  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError('Product is not found', StatusCodes.NOT_FOUND);
  }

  // 4. Check ownership
  const productSellerId = (product as any)?.sellerId;

  if (productSellerId?.toString() !== sellerId) {
    throw new AppError('You are not allowed to update this product', StatusCodes.FORBIDDEN);
  }

  // 5. Validate category if seller wants to change it
  if (payload.categoryId) {
    const category = await Category.findOne({
      _id: payload.categoryId,
      isActive: true,
    });

    if (!category) {
      throw new AppError('Active category not found', StatusCodes.NOT_FOUND);
    }
  }

  // 6. Update name + slug
  let slug = product.slug;

  if (payload.name && payload.name.trim() !== product.name) {
    slug = slugify(payload.name.trim(), {
      lower: true,
      strict: true,
      trim: true,
    });

    const existingProduct = await Product.findOne({
      slug,
      _id: { $ne: productId },
    });

    if (existingProduct) {
      slug = `${slug}-${Date.now()}`;
    }
  }

  // 7. Upload new images if provided
  let images = product.images;

  if (files && files.length > 0) {
    if (files.length > 5) {
      throw new AppError('You can upload a maximum of 5 product images', StatusCodes.BAD_REQUEST);
    }

    const uploadedImages = [];

    for (const file of files) {
      const uploadResult = await uploadToCloudinary(file.path, 'products');

      uploadedImages.push({
        publicId: uploadResult.public_id,
        url: uploadResult.secure_url,
      });
    }

    images = uploadedImages;
  }

  // 8. Prepare update data
  const updateData: Partial<IProduct> = {
    ...payload,
    name: payload.name?.trim(),
    description: payload.description?.trim(),
    slug,
    images,
  };

  // 9. Update product
  const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, {
    new: true,
    runValidators: true,
  });

  return updatedProduct;
};

const productService = {
  addNewProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
};

export default productService;
