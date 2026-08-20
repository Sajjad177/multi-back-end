import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import config from '../../config';
import AppError from '../../errors/AppError';
import {
  generateOtp,
  generateSuspensionToken,
  generateTokens,
  verifyRefreshToken,
} from '../../helper/helper';
import { companyName } from '../../lib/globalType';
import sendEmail from '../../utils/sendEmail';
import verificationCodeTemplate from '../../utils/verificationCodeTemplate';
import { User } from '../user/user.model';
import { USER_STATUS } from '../user/user.constant';
import { Suspension } from '../suspension/suspension.model';
import { AppealStatus, SuspensionStatus } from '../suspension/suspension.interface';

const login = async (payload: { email: string; password: string }) => {
  const { email, password } = payload;
  const user = await User.isUserExistByEmailWithPassword(email);

  if (!user) {
    throw new AppError('No account found with the provided credentials.', StatusCodes.NOT_FOUND);
  }

  if (!user.isVerified) {
    throw new AppError('Please verify your email before logging in', StatusCodes.UNAUTHORIZED);
  }

  if (!user.password) {
    throw new AppError('Password is not set for this account.', StatusCodes.UNAUTHORIZED);
  }

  const isPasswordValid = await User.isPasswordMatch(password, user.password);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', StatusCodes.UNAUTHORIZED);
  }

  // ==========================================
  // BLOCKED ACCOUNT
  // ==========================================

  if (user.status === USER_STATUS.BLOCKED) {
    throw new AppError(
      'Your account has been blocked. Please contact support.',
      StatusCodes.FORBIDDEN,
    );
  }

  // ==========================================
  // SUSPENDED ACCOUNT
  // ==========================================

  if (user.status === USER_STATUS.SUSPENDED) {
    const suspension = await Suspension.findOne({
      userId: user._id,
      status: SuspensionStatus.ACTIVE,
    });

    if (!suspension) {
      throw new AppError(
        'Your account is suspended, but no active suspension record was found. Please contact support.',
        StatusCodes.FORBIDDEN,
      );
    }

    const suspensionToken = generateSuspensionToken(user);

    return {
      accessToken: suspensionToken,
      tokenType: 'SUSPENSION_APPEAL',

      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },

      accountStatus: USER_STATUS.SUSPENDED,

      suspension: {
        _id: suspension._id,
        type: suspension.type,
        reason: suspension.reason,
        description: suspension.description,
        status: suspension.status,
        suspendedAt: suspension.suspendedAt,
        expiresAt: suspension.expiresAt,
        appealStatus: suspension.appealStatus,
        appealDescription: suspension.appealDescription,
        appealedAt: suspension.appealedAt,
        canAppeal:
          suspension.appealStatus === AppealStatus.NONE ||
          suspension.appealStatus === AppealStatus.REJECTED,
      },
    };
  }

  // ==========================================
  // ACTIVE ACCOUNT
  // ==========================================

  if (user.status !== USER_STATUS.ACTIVE) {
    throw new AppError(
      'Your account is not active. Please contact support for more information.',
      StatusCodes.FORBIDDEN,
    );
  }

  const tokens = generateTokens(user);

  return {
    ...tokens,

    tokenType: 'ACCESS',

    user: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  };
};

const refreshToken = async (token: string) => {
  if (!token) {
    throw new AppError('Refresh token is required', StatusCodes.UNAUTHORIZED);
  }

  let decodedToken;

  try {
    decodedToken = verifyRefreshToken(token);
  } catch {
    throw new AppError('Invalid or expired refresh token', StatusCodes.UNAUTHORIZED);
  }

  if (!decodedToken?.userId) {
    throw new AppError('Invalid refresh token', StatusCodes.UNAUTHORIZED);
  }

  const user = await User.findById(decodedToken.userId).select('_id role status isVerified');
  if (!user) {
    throw new AppError('User account not found', StatusCodes.UNAUTHORIZED);
  }

  if (user.status !== 'active') {
    throw new AppError(
      'Your account is not active. Please contact support for more information.. Please contact support for more information.',
      StatusCodes.FORBIDDEN,
    );
  }

  if (!user.isVerified) {
    throw new AppError('Please verify your email', StatusCodes.UNAUTHORIZED);
  }

  const tokens = generateTokens(user);
  return tokens;
};

const forgotPassword = async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.isUserExistByEmail(normalizedEmail);

  if (!user || !user.isVerified) {
    throw new AppError('No account found with the provided credentials.', StatusCodes.NOT_FOUND);
  }

  const { otp, hashedOtp, otpExpires } = await generateOtp();
  await User.findByIdAndUpdate(user._id, {
    passwordReset: {
      otpHash: hashedOtp,
      expiresAt: otpExpires,
      attempts: 0,
    },
  });

  await sendEmail({
    to: user.email,
    subject: 'Reset your Shoppy password',
    html: verificationCodeTemplate(otp),
  });
};

const resendForgotOtpCode = async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.isUserExistByEmail(normalizedEmail);

  if (!user || !user.isVerified) {
    return;
  }

  if (!user.passwordReset?.otpHash) {
    throw new AppError('Please request a password reset first.', StatusCodes.BAD_REQUEST);
  }

  const { otp, hashedOtp, otpExpires } = await generateOtp();
  await User.findByIdAndUpdate(user._id, {
    passwordReset: {
      otpHash: hashedOtp,
      expiresAt: otpExpires,
      attempts: 0,
    },
  });

  await sendEmail({
    to: user.email,
    subject: `${companyName} - Password Reset OTP`,
    html: verificationCodeTemplate(otp),
  });
};

const verifyOtp = async (email: string, otp: string) => {
  if (!otp) {
    throw new AppError('OTP is required', StatusCodes.BAD_REQUEST);
  }

  const user = await User.isUserExistByEmail(email);
  if (!user) {
    throw new AppError('No account found with the provided credentials.', StatusCodes.NOT_FOUND);
  }

  if (!user.passwordReset?.otpHash || !user.passwordReset?.expiresAt) {
    throw new AppError('Password reset OTP not requested or has expired', StatusCodes.BAD_REQUEST);
  }

  if (user.passwordReset.expiresAt < new Date()) {
    throw new AppError('Password reset OTP has expired', StatusCodes.BAD_REQUEST);
  }

  const isOtpMatched = await bcrypt.compare(otp, user.passwordReset.otpHash);
  if (!isOtpMatched) {
    throw new AppError('Invalid OTP', StatusCodes.BAD_REQUEST);
  }

  await User.findByIdAndUpdate(user._id, {
    $unset: {
      'passwordReset.otpHash': 1,
      'passwordReset.expiresAt': 1,
    },
  });

  const token = generateTokens(user);
  return token.refreshToken;
};

const resetPassword = async (newPassword: string, userId: string) => {
  if (!newPassword) {
    throw new AppError('New password is required', StatusCodes.BAD_REQUEST);
  }

  const user = await User.isUserExistById(userId);
  if (!user) {
    throw new AppError('No account found with the provided credentials.', StatusCodes.NOT_FOUND);
  }

  if (!user.password) {
    throw new AppError(
      'Current password is not available for this account.',
      StatusCodes.BAD_REQUEST,
    );
  }

  // Check new password against current password
  const isSamePassword = await User.isPasswordMatch(newPassword, user.password);
  if (isSamePassword) {
    throw new AppError(
      'New password cannot be the same as the current password',
      StatusCodes.BAD_REQUEST,
    );
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, Number(config.bcryptSaltRounds));
  const result = await User.findByIdAndUpdate(
    user._id,
    {
      $set: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
      $unset: {
        'passwordReset.verifiedAt': 1,
        'passwordReset.otpHash': 1,
        'passwordReset.expiresAt': 1,
      },
    },
    {
      new: true,
    },
  ).select('_id firstName lastName email role status isVerified avatar');

  return result;
};

const changePassword = async (
  payload: {
    currentPassword: string;
    newPassword: string;
  },
  userId: string,
) => {
  const { currentPassword, newPassword } = payload;

  const user = await User.isUserExistById(userId);

  if (!user) {
    throw new AppError('No account found with the provided credentials.', StatusCodes.NOT_FOUND);
  }

  if (!user.password) {
    throw new AppError(
      'Current password is not available for this account.',
      StatusCodes.BAD_REQUEST,
    );
  }

  // Verify current password
  const isCurrentPasswordValid = await User.isPasswordMatch(currentPassword, user.password);

  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', StatusCodes.BAD_REQUEST);
  }

  // Prevent using the same password
  const isSamePassword = await User.isPasswordMatch(newPassword, user.password);

  if (isSamePassword) {
    throw new AppError(
      'New password cannot be the same as the current password',
      StatusCodes.BAD_REQUEST,
    );
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, Number(config.bcryptSaltRounds));

  // Update password
  const result = await User.findByIdAndUpdate(
    user._id,
    {
      $set: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    },
    {
      new: true,
    },
  ).select('_id firstName lastName email role status isVerified avatar');

  return result;
};

const authService = {
  login,
  refreshToken,
  forgotPassword,
  resendForgotOtpCode,
  verifyOtp,
  resetPassword,
  changePassword,
};

export default authService;
