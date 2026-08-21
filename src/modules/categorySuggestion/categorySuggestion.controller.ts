import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import categorySuggestionService from './categorySuggestion.service';

const suggestCategory = catchAsync(async (req, res) => {
  const { email } = req.user;
  const result = await categorySuggestionService.suggestCategory(req.body, email);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Category created successfully',
    data: result,
  });
});

const reviewCategorySuggestion = catchAsync(async (req, res) => {
  const { suggestionId } = req.params;
  const result = await categorySuggestionService.reviewCategorySuggestion(
    suggestionId as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Category suggestion reviewed successfully.',
    data: result,
  });
});

const categorySuggestionController = {
  suggestCategory,
  reviewCategorySuggestion,
};

export default categorySuggestionController;
