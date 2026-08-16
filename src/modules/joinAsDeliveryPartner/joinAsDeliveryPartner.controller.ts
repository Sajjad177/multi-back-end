import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { IUser } from '../user/user.interface';
import JoinAsDeliveryPartnerService from './joinAsDeliveryPartner.service';

const joinAsDeliveryPartner = catchAsync(async (req, res) => {
  const files = req.files;
  const currentUser = req.user as IUser | undefined;

  const result = await JoinAsDeliveryPartnerService.joinAsDeliveryPartner(
    req.body,
    currentUser,
    files as Express.Multer.File[],
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Delivery partner application submitted successfully',
    data: result,
  });
});

const getAllJoinAsDeliveryPartnerApplications = catchAsync(async (req, res) => {
  const result = await JoinAsDeliveryPartnerService.getAllJoinAsDeliveryPartnerApplications(
    req.query,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Delivery partner applications retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getJoinAsDeliveryPartnerApplicationById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await JoinAsDeliveryPartnerService.getJoinAsDeliveryPartnerApplicationById(
    id as string,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Delivery partner application retrieved successfully',
    data: result,
  });
});

const updateJoinAsDeliveryPartnerApplicationStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;

  const result = await JoinAsDeliveryPartnerService.updateJoinAsDeliveryPartnerApplicationStatus(
    id as string,
    status,
    rejectionReason,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Delivery partner application status updated successfully',
    data: result,
  });
});

const resendDeliveryPartnerSetupLink = catchAsync(async (req, res) => {
  const { email } = req.body;
  await JoinAsDeliveryPartnerService.resendDeliveryPartnerSetupLink(email);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'If your delivery partner account is eligible, a setup link has been sent.',
    data: null,
  });
});

const setupDeliveryPartnerPassword = catchAsync(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const result = await JoinAsDeliveryPartnerService.setupDeliveryPartnerPassword(
    token as string,
    password,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Delivery partner password setup successfully',
    data: result,
  });
});

const JoinAsDeliveryPartnerController = {
  joinAsDeliveryPartner,
  getAllJoinAsDeliveryPartnerApplications,
  getJoinAsDeliveryPartnerApplicationById,
  updateJoinAsDeliveryPartnerApplicationStatus,
  resendDeliveryPartnerSetupLink,
  setupDeliveryPartnerPassword,
};

export default JoinAsDeliveryPartnerController;
