import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import productService from './product.service';

const addNewProduct = catchAsync(async (req, res) => {
  const files = req.files as Express.Multer.File[];

  const sellerId = req.user.sub;
  const result = await productService.addNewProduct(req.body, files, sellerId as string);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Product is created successfully',
    data: result,
  });
});

const getAllProducts = catchAsync(async (req, res) => {
  const result = await productService.getAllProducts(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Product is get successfully',
    data: result.data,
    meta: result.meta,
  });
});

const productController = {
  addNewProduct,
  getAllProducts,
};

export default productController;
