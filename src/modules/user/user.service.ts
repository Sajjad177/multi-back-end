import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../errors/AppError';
import { deleteFromCloudinary, uploadToCloudinary } from '../../utils/cloudinary';
import sendEmail from '../../utils/sendEmail';
import verificationCodeTemplate from '../../utils/verificationCodeTemplate';
import { USER_ROLE, USER_STATUS } from './user.constant';
import { IUser } from './user.interface';
import { User } from './user.model';
import { generateOtp, generateTokens, sanitizeUser } from '../../helper/helper';

const RESEND_COOL_DOWN_SECONDS = 60;

const registerUser = async (payload: IUser) => {
  const email = payload.email.toLowerCase().trim();
  const existingUser = await User.isUserExistByEmail(email);

  if (existingUser?.isVerified) {
    throw new AppError('User already exists', StatusCodes.CONFLICT);
  }

  const { otp, hashedOtp, otpExpires } = await generateOtp();

  let user: IUser;

  if (existingUser) {
    user = (await User.findByIdAndUpdate(
      existingUser._id,
      {
        $set: {
          emailVerification: {
            otpHash: hashedOtp,
            expiresAt: otpExpires,
            attempts: 0,
          },
        },
      },
      {
        new: true,
        runValidators: true,
      },
    )) as IUser;
  } else {
    user = await User.create({
      ...payload,
      email,
      role: USER_ROLE.CUSTOMER,
      status: USER_STATUS.ACTIVE,
      isVerified: false,

      emailVerification: {
        otpHash: hashedOtp,
        expiresAt: otpExpires,
        attempts: 0,
      },
    });
  }

  if (!user) {
    throw new AppError('Failed to create user', StatusCodes.INTERNAL_SERVER_ERROR);
  }

  await sendEmail({
    to: user.email,
    subject: 'Verify your email',
    html: verificationCodeTemplate(otp),
  });

  const token = generateTokens(user);

  return {
    token,
    user: sanitizeUser(user),
  };
};
const verifyEmail = async (email: string, payload: { otp: string }) => {
  const { otp } = payload;

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
  }).select('+emailVerification.otpHash +emailVerification.expiresAt +emailVerification.attempts');

  if (!user) {
    throw new AppError('No account found with the provided credentials.', StatusCodes.NOT_FOUND);
  }

  if (user.isVerified) {
    throw new AppError('Email is already verified.', StatusCodes.CONFLICT);
  }

  const verification = user.emailVerification;
  if (!verification?.otpHash || !verification.expiresAt) {
    throw new AppError(
      'Verification code not found. Please request a new code.',
      StatusCodes.BAD_REQUEST,
    );
  }

  if (verification.expiresAt.getTime() < Date.now()) {
    throw new AppError(
      'Verification code has expired. Please request a new code.',
      StatusCodes.BAD_REQUEST,
    );
  }

  const MAX_OTP_ATTEMPTS = 5;
  if (verification.attempts >= MAX_OTP_ATTEMPTS) {
    throw new AppError(
      'Too many invalid attempts. Please request a new verification code.',
      StatusCodes.TOO_MANY_REQUESTS,
    );
  }

  const isOtpMatched = await bcrypt.compare(otp, verification.otpHash);
  if (!isOtpMatched) {
    await User.updateOne(
      { _id: user._id },
      {
        $inc: {
          'emailVerification.attempts': 1,
        },
      },
    );

    throw new AppError('Invalid verification code.', StatusCodes.BAD_REQUEST);
  }

  const result = await User.findOneAndUpdate(
    {
      _id: user._id,
      isVerified: false,
    },
    {
      $set: {
        isVerified: true,
      },
      $unset: {
        emailVerification: '',
      },
    },
    {
      new: true,
      projection: {
        _id: 1,
        firstName: 1,
        lastName: 1,
        email: 1,
        role: 1,
        status: 1,
        isVerified: 1,
      },
    },
  );

  if (!result) {
    throw new AppError('Email verification failed. Please try again.', StatusCodes.CONFLICT);
  }

  return result;
};

const resendOtpCode = async (email: string) => {
  const user = await User.findOne({ email }).select(
    '_id email firstName lastName role isVerified emailVerification',
  );

  if (!user) {
    throw new AppError('No account found with the provided credentials.', StatusCodes.NOT_FOUND);
  }

  if (user.isVerified) {
    throw new AppError('Email is already verified.', StatusCodes.CONFLICT);
  }

  // Prevent OTP spam
  const lastSentAt = user.emailVerification?.lastSentAt;

  if (lastSentAt) {
    const elapsedSeconds = (Date.now() - lastSentAt.getTime()) / 1000;

    if (elapsedSeconds < RESEND_COOL_DOWN_SECONDS) {
      const remainingSeconds = Math.ceil(RESEND_COOL_DOWN_SECONDS - elapsedSeconds);

      throw new AppError(
        `Please wait ${remainingSeconds} seconds before requesting a new OTP.`,
        StatusCodes.TOO_MANY_REQUESTS,
      );
    }
  }

  const { otp, hashedOtp, otpExpires } = await generateOtp();

  const result = await User.findByIdAndUpdate(
    user._id,
    {
      $set: {
        'emailVerification.otpHash': hashedOtp,
        'emailVerification.expiresAt': otpExpires,
        'emailVerification.lastSentAt': new Date(),
        'emailVerification.attempts': 0,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  ).select('_id email firstName lastName role isVerified');

  if (!result) {
    throw new AppError('Failed to generate verification OTP.', StatusCodes.INTERNAL_SERVER_ERROR);
  }

  await sendEmail({
    to: result.email,
    subject: 'Verify your email — Shoppy',
    html: verificationCodeTemplate(otp),
  });

  return {
    email: result.email,
    expiresAt: otpExpires,
  };
};

const getAllUsers = async () => {
  const result = await User.find().select('username firstName lastName email role');
  return result;
};

const getAdminId = async () => {
  const admin = await User.findOne({ role: USER_ROLE.ADMIN }).select('_id');
  return admin;
};

const getMyProfile = async (email: string) => {
  const existingUser = await User.findOne({ email });
  if (!existingUser)
    throw new AppError('No account found with the provided credentials.', StatusCodes.NOT_FOUND);

  const result = await User.findOne({ email }).select(
    '-password -otp -otpExpires -resetPasswordOtp -resetPasswordOtpExpires',
  );

  return result;
};

const updateUserProfile = async (payload: any, email: string, file: any) => {
  const user = await User.findOne({ email }).select('avatar');
  if (!user)
    throw new AppError('No account found with the provided credentials.', StatusCodes.NOT_FOUND);

  // eslint-disable-next-line prefer-const
  let updateData: any = { ...payload };
  let oldImagePublicId: string | undefined;

  if (file) {
    const uploadResult = await uploadToCloudinary(file.path, 'users');
    oldImagePublicId = user.avatar?.publicId;

    updateData.avatar = {
      publicId: uploadResult.public_id,
      url: uploadResult.secure_url,
    };
  }

  const result = await User.findOneAndUpdate({ email }, updateData, {
    new: true,
  }).select('-password -otp -otpExpires -resetPasswordOtp -resetPasswordOtpExpires');

  if (file && oldImagePublicId) {
    await deleteFromCloudinary(oldImagePublicId);
  }

  return result;
};

const userService = {
  registerUser,
  verifyEmail,
  resendOtpCode,
  getAllUsers,
  getMyProfile,
  updateUserProfile,
  getAdminId,
};

export default userService;
