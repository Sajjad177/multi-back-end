import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { SUSPENSION_ERROR_MESSAGES } from './suspension.constant';
import suspensionService from './suspension.service';

const suspendUser = catchAsync(async (req, res) => {
  const result = await suspensionService.suspendUser(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: SUSPENSION_ERROR_MESSAGES.SUSPENSION_CREATED,
    data: result,
  });
});

const suspensionController = {
  suspendUser,
};

export default suspensionController;
