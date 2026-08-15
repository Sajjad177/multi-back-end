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
const verifyEmail = async (email: string, payload: string) => {
  const { otp }: any = payload;
  if (!otp) throw new Error('OTP is required');

  const existingUser = await User.findOne({ email });
  if (!existingUser)
    throw new AppError('No account found with the provided credentials.', StatusCodes.NOT_FOUND);

  if (!existingUser.otp || !existingUser.otpExpires) {
    throw new AppError('OTP not requested or expired', StatusCodes.BAD_REQUEST);
  }

  if (existingUser.otpExpires < new Date()) {
    throw new AppError('OTP has expired', StatusCodes.BAD_REQUEST);
  }

  if (existingUser.isVerified === true) {
    throw new AppError('User already verified', StatusCodes.CONFLICT);
  }

  const isOtpMatched = await bcrypt.compare(otp.toString(), existingUser.otp);
  if (!isOtpMatched) throw new AppError('Invalid OTP', StatusCodes.BAD_REQUEST);

  const result = await User.findOneAndUpdate(
    { email },
    {
      isVerified: true,
      $unset: { otp: '', otpExpires: '' },
    },
    { new: true },
  ).select('username email role');
  return result;
};

const resendOtpCode = async (email: string) => {
  const existingUser = await User.findOne({ email });
  if (!existingUser)
    throw new AppError('No account found with the provided credentials.', StatusCodes.NOT_FOUND);

  if (existingUser.isVerified === true) {
    throw new AppError('User already verified', StatusCodes.CONFLICT);
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await bcrypt.hash(otp, 10);
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

  const result = await User.findOneAndUpdate(
    { email },
    {
      otp: hashedOtp,
      otpExpires,
    },
    { new: true },
  ).select('username email role');

  await sendEmail({
    to: existingUser.email,
    subject: 'Verify your email',
    html: verificationCodeTemplate(otp),
  });
  return result;
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
  const user = await User.findOne({ email }).select('image');
  if (!user)
    throw new AppError('No account found with the provided credentials.', StatusCodes.NOT_FOUND);

  // eslint-disable-next-line prefer-const
  let updateData: any = { ...payload };
  let oldImagePublicId: string | undefined;

  if (file) {
    const uploadResult = await uploadToCloudinary(file.path, 'users');
    oldImagePublicId = user.image?.public_id;

    updateData.image = {
      public_id: uploadResult.public_id,
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
