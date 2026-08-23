import { StatusCodes } from 'http-status-codes';
import AppError from '../errors/AppError';
import { USER_ROLE, USER_STATUS } from '../modules/user/user.constant';
import { IUser } from '../modules/user/user.interface';
import { User } from '../modules/user/user.model';

export const getUserWithValidation = async (userId: string): Promise<IUser> => {
  if (!userId) {
    throw new AppError('User ID is required', StatusCodes.BAD_REQUEST);
  }

  const user = await User.isUserExistById(userId);
  if (!user) {
    throw new AppError('User not found', StatusCodes.NOT_FOUND);
  }

  return user;
};

export const assertActiveCustomer = async (userId: string): Promise<IUser> => {
  const user = await getUserWithValidation(userId);

  if (user.role !== USER_ROLE.CUSTOMER) {
    throw new AppError('Only customers can perform this action', StatusCodes.FORBIDDEN);
  }

  if (user.status === USER_STATUS.SUSPENDED) {
    throw new AppError(
      'Your account has been suspended and cannot perform this action',
      StatusCodes.FORBIDDEN,
    );
  }

  if (user.status === USER_STATUS.BLOCKED) {
    throw new AppError(
      'Your account has been blocked and cannot perform any action',
      StatusCodes.FORBIDDEN,
    );
  }

  if (!user.isVerified) {
    throw new AppError(
      'Please verify your email before performing this action',
      StatusCodes.UNAUTHORIZED,
    );
  }

  return user;
};

export const assertActiveSeller = async (userId: string): Promise<IUser> => {
  const user = await getUserWithValidation(userId);

  if (user.role !== USER_ROLE.SELLER) {
    throw new AppError('Only sellers can perform this action', StatusCodes.FORBIDDEN);
  }

  if (user.status === USER_STATUS.SUSPENDED) {
    throw new AppError(
      'Your seller account has been suspended and cannot perform this action',
      StatusCodes.FORBIDDEN,
    );
  }

  if (user.status === USER_STATUS.BLOCKED) {
    throw new AppError(
      'Your seller account has been blocked and cannot perform any action',
      StatusCodes.FORBIDDEN,
    );
  }

  if (!user.isVerified) {
    throw new AppError(
      'Please verify your email before performing seller operations',
      StatusCodes.UNAUTHORIZED,
    );
  }

  return user;
};

export const assertActiveDeliveryPartner = async (userId: string): Promise<IUser> => {
  const user = await getUserWithValidation(userId);

  if (user.role !== USER_ROLE.DELIVERY_PARTNER) {
    throw new AppError('Only delivery partners can perform this action', StatusCodes.FORBIDDEN);
  }

  if (user.status === USER_STATUS.SUSPENDED) {
    throw new AppError(
      'Your delivery partner account has been suspended and cannot perform this action',
      StatusCodes.FORBIDDEN,
    );
  }

  if (user.status === USER_STATUS.BLOCKED) {
    throw new AppError(
      'Your delivery partner account has been blocked and cannot perform any action',
      StatusCodes.FORBIDDEN,
    );
  }

  if (!user.isVerified) {
    throw new AppError(
      'Please verify your email before performing delivery partner operations',
      StatusCodes.UNAUTHORIZED,
    );
  }

  return user;
};
