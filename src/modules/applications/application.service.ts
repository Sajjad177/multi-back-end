import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import AppError from '../../errors/AppError';
import { USER_ROLE, USER_STATUS } from '../user/user.constant';
import { User } from '../user/user.model';
import { APPLICATION_STATUS } from './application.constant';

export const resolveAuthenticatedApplicant = async (currentUser?: JwtPayload | null) => {
  const email = currentUser?.email?.trim().toLowerCase();

  if (!email) {
    return null;
  }

  return User.isUserExistByEmail(email);
};

export const createGuestApplicant = async (payload: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}) => {
  const email = payload.email.trim().toLowerCase();

  const existingUser = await User.isUserExistByEmail(email);

  if (existingUser) {
    throw new AppError(
      'An account already exists with this email. Please login and apply.',
      StatusCodes.CONFLICT,
    );
  }

  const [createdUser] = await User.create([
    {
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      email,
      phone: payload.phone,
      role: USER_ROLE.CUSTOMER,
      status: USER_STATUS.ACTIVE,
      isVerified: false,
    },
  ]);

  return createdUser;
};

export const checkPendingApplication = async (
  model: { findOne: (criteria: Record<string, unknown>) => Promise<unknown> },
  userId: string,
) => {
  return model.findOne({
    userId,
    status: APPLICATION_STATUS.PENDING,
  });
};

export const ApplicationService = {
  resolveAuthenticatedApplicant,
  createGuestApplicant,
  checkPendingApplication,
};

export default ApplicationService;
