import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { IUser } from '../user/user.interface';
import JoinAsSellerService from './joinAsSeller.service';

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

const getAllJoinAsSellerApplications = catchAsync(async (req, res) => {
  const result = await JoinAsSellerService.getAllJoinAsSellerApplications(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Seller applications retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getJoinAsSellerApplicationById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await JoinAsSellerService.getJoinAsSellerApplicationById(id as string);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Join as seller application retrieved successfully',
    data: result,
  });
});

const JoinAsSellerController = {
  joinAsSeller,
  getAllJoinAsSellerApplications,
  getJoinAsSellerApplicationById,
};

export default JoinAsSellerController;
