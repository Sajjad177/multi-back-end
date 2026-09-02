import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../utils/catchAsync';
import productListingService from './productListing.service';
import sendResponse from '../../utils/sendResponse';

const addProductListing = catchAsync(async (req, res) => {
  const sellerId = req.user.sub;
  const result = await productListingService.addProductListing(sellerId as string, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Product listing is created successfully',
    data: result,
  });
});

const getAllProductListings = catchAsync(async (req, res) => {
  const result = await productListingService.getAllProductListings(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Product listings retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getSingleProductListing = catchAsync(async (req, res) => {
  const { productListingId } = req.params;
  const result = await productListingService.getSingleProductListing(productListingId as string);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Product listing retrieved successfully',
    data: result,
  });
});

const updateProductListing = catchAsync(async (req, res) => {
  const { productListingId } = req.params;
  const sellerId = req.user.sub;

  const result = await productListingService.updateProductListing(
    productListingId as string,
    req.body,
    sellerId as string,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Product listing updated successfully',
    data: result,
  });
});

const deleteProductListing = catchAsync(async (req, res) => {});

const productListingController = {
  addProductListing,
  getAllProductListings,
  getSingleProductListing,
  updateProductListing,
  deleteProductListing,
};

export default productListingController;
