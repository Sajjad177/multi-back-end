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
  const result = await categoryService.getAllCategories();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Categories retrieved successfully',
    data: result,
  });
});

const categoryController = {
  createNewCategory,
  getAllCategories,
};

export default categoryController;
