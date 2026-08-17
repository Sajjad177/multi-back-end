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

const submitAppeal = catchAsync(async (req, res) => {
  const { suspensionId } = req.params;
  const authUser = req.user as { sub: string; role: string; email: string };
  const { appealDescription } = req.body;
  const files = req.files as Express.Multer.File[] | undefined;

  const result = await suspensionService.submitAppeal(
    suspensionId as string,
    authUser,
    appealDescription,
    files,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Appeal submitted successfully',
    data: result,
  });
});

const suspensionController = {
  suspendUser,
  submitAppeal,
};

export default suspensionController;
