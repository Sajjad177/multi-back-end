import { StatusCodes } from 'http-status-codes';
import { assertActiveSeller } from '../../helper/userEligibility';
import { DISCOUNT_TYPE, IProductListing, LISTING_STATUS } from './productListing.interface';
import AppError from '../../errors/AppError';
import { Product } from '../product/product.model';
import { ProductListing } from './productListing.model';
import QueryBuilder from '../../helper/QueryBuilder';

const addProductListing = async (sellerId: string, productListingData: IProductListing) => {
  const {
    productId,
    basePrice,
    quantityOptions,
    discount,
    stock,
    allowCustomQuantity,
    minOrderQuantity,
    maxOrderQuantity,
  } = productListingData;

  // 1. Validate seller
  await assertActiveSeller(sellerId);

  // 2. Validate productId
  if (!productId) {
    throw new AppError('Product ID is required', StatusCodes.BAD_REQUEST);
  }

  // 3. Check product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product is not found', StatusCodes.NOT_FOUND);
  }

  // 4. Product must be active
  if (product.status !== 'active') {
    throw new AppError('This product is not currently available', StatusCodes.BAD_REQUEST);
  }

  // 5. Check duplicate listing
  const existingListing = await ProductListing.findOne({
    productId,
    sellerId,
  });

  if (existingListing) {
    throw new AppError('You already have a listing for this product', StatusCodes.CONFLICT);
  }

  // 6. Validate base price
  if (basePrice === undefined || basePrice <= 0) {
    throw new AppError('Base price must be greater than 0', StatusCodes.BAD_REQUEST);
  }

  // 7. Validate stock
  if (stock === undefined || stock < 0) {
    throw new AppError('Stock cannot be negative', StatusCodes.BAD_REQUEST);
  }

  // 8. Validate quantity options
  if (!quantityOptions || quantityOptions.length === 0) {
    throw new AppError('At least one quantity option is required', StatusCodes.BAD_REQUEST);
  }

  for (const option of quantityOptions) {
    if (option.quantity <= 0) {
      throw new AppError('Quantity must be greater than 0', StatusCodes.BAD_REQUEST);
    }

    if (option.price <= 0) {
      throw new AppError('Quantity option price must be greater than 0', StatusCodes.BAD_REQUEST);
    }
  }

  // 9. Validate duplicate quantity options
  const quantities = quantityOptions.map((option) => option.quantity);
  const uniqueQuantities = new Set(quantities);

  if (uniqueQuantities.size !== quantities.length) {
    throw new AppError('Duplicate quantity options are not allowed', StatusCodes.BAD_REQUEST);
  }

  // 10. Validate discount
  if (discount) {
    if (discount.value <= 0) {
      throw new AppError('Discount value must be greater than 0', StatusCodes.BAD_REQUEST);
    }

    if (discount.type === DISCOUNT_TYPE.PERCENTAGE && discount.value > 100) {
      throw new AppError('Percentage discount cannot exceed 100%', StatusCodes.BAD_REQUEST);
    }

    if (
      discount.startsAt &&
      discount.endsAt &&
      new Date(discount.startsAt) >= new Date(discount.endsAt)
    ) {
      throw new AppError('Discount end date must be after start date', StatusCodes.BAD_REQUEST);
    }
  }

  // 11. Validate custom quantity
  if (allowCustomQuantity) {
    if (minOrderQuantity === undefined || minOrderQuantity <= 0) {
      throw new AppError(
        'Minimum order quantity is required when custom quantity is enabled',
        StatusCodes.BAD_REQUEST,
      );
    }

    if (maxOrderQuantity === undefined || maxOrderQuantity <= 0) {
      throw new AppError(
        'Maximum order quantity is required when custom quantity is enabled',
        StatusCodes.BAD_REQUEST,
      );
    }

    if (minOrderQuantity > maxOrderQuantity) {
      throw new AppError(
        'Minimum order quantity cannot be greater than maximum order quantity',
        StatusCodes.BAD_REQUEST,
      );
    }
  }

  // 12. Create listing
  const listing = await ProductListing.create({
    productId,
    sellerId,
    basePrice,
    quantityOptions,
    discount,
    stock,
    allowCustomQuantity,
    minOrderQuantity: allowCustomQuantity ? minOrderQuantity : undefined,
    maxOrderQuantity: allowCustomQuantity ? maxOrderQuantity : undefined,
    status: stock > 0 ? LISTING_STATUS.ACTIVE : LISTING_STATUS.OUT_OF_STOCK,
  });

  return listing;
};

const getAllProductListings = async (query: any) => {
  const searchableFields = ['name'];

  return new QueryBuilder(ProductListing, query)
    .search(searchableFields)
    .filter(['searchTerm', 'sortBy', 'sortOrder', 'page', 'limit'])
    .sort()
    .paginate()
    .populate({
      path: 'productId',
    })
    .populate({
      path: 'sellerId',
      select: 'firstName lastName email avatar',
    })
    .getPaginatedResult();
};

const getSingleProductListing = async (productListingId: string) => {
  const listing = await ProductListing.findById(productListingId)
    .populate({
      path: 'productId',
    })
    .populate({
      path: 'sellerId',
      select: 'firstName lastName email avatar',
    });

  if (!listing) {
    throw new AppError('Product listing not found', StatusCodes.NOT_FOUND);
  }

  return listing;
};

const updateProductListing = async (productListingId: string, updateData: any) => {
  // Implement the logic to update a product listing by its ID
};

const deleteProductListing = async (productListingId: string) => {
  // Implement the logic to delete a product listing by its ID
};

const productListingService = {
  addProductListing,
  getAllProductListings,
  getSingleProductListing,
  updateProductListing,
  deleteProductListing,
};

export default productListingService;
