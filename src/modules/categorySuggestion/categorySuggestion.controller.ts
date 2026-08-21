import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import categorySuggestionService from './categorySuggestion.service';

const suggestCategory = catchAsync(async (req, res) => {
  const { email } = req.user;
  const result = await categorySuggestionService.suggestCategory(req.body, email);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Category created successfully',
    data: result,
  });
});

const categorySuggestionController = {
  suggestCategory,
};

export default categorySuggestionController;
