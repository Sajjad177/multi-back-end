import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import JoinAsSellerService from './joinAsSeller.service';
import { IUser } from '../user/user.interface';

const joinAsSeller = catchAsync(async (req, res) => {
  const files = req.files;

  const currentUser = req.user as IUser | undefined;
  const result = await JoinAsSellerService.joinAsSeller(
    req.body,
    currentUser,
    files as Express.Multer.File[],
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Seller application submitted successfully',
    data: result,
  });
});
const JoinAsSellerController = {
  joinAsSeller,
};

export default JoinAsSellerController;
