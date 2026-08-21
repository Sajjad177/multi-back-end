import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import categoryService from './category.service';

const createNewCategory = catchAsync(async (req, res) => {
  const file = req.file;
  const result = await categoryService.createNewCategory(req.body, file as Express.Multer.File);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Category created successfully',
    data: result,
  });
});

const getAllCategories = catchAsync(async (req, res) => {
  const result = await categoryService.getAllCategories(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Categories retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getSingleCategories = catchAsync(async (req, res) => {
  const { categoryId } = req.params;
  const result = await categoryService.getSingleCategories(categoryId as string);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Categories retrieved successfully',
    data: result,
  });
});

const updateCategory = catchAsync(async (req, res) => {
  const { categoryId } = req.params;
  const result = await categoryService.updateCategory(categoryId as string, req.body, req.file);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Category updated successfully.',
    data: result,
  });
});

const toggleCategoryStatus = catchAsync(async (req, res) => {
  const { categoryId } = req.params;
  const result = await categoryService.toggleCategoryStatus(categoryId as string);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `Category ${result.isActive ? 'activated' : 'deactivated'} successfully.`,
    data: result,
  });
});

const categoryController = {
  createNewCategory,
  getAllCategories,
  getSingleCategories,
  updateCategory,
  toggleCategoryStatus,
};

export default categoryController;
