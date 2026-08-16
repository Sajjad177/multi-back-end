import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';
import AppError from '../../errors/AppError';
import QueryBuilder from '../../helper/QueryBuilder';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { USER_ROLE, USER_STATUS } from '../user/user.constant';
import { IUser } from '../user/user.interface';
import { User } from '../user/user.model';
import { DOCUMENT_TYPE, JOIN_SELLER_STATUS } from './joinAsSeller.constant';
import { IJoinAsSeller, TJoinSellerStatus } from './joinAsSeller.interface';
import { JoinAsSeller } from './joinAsSeller.model';
import sendEmail from '../../utils/sendEmail';
import sellerApplicationApprovedTemplate from '../../utils/sellerApplicationApprovedTemplate';
import sellerApplicationRejectedTemplate from '../../utils/sellerApplicationRejectedTemplate';
import * as crypto from 'node:crypto';
import config from '../../config';
import { generateSecureToken } from '../../helper/generateSecureToken';
import bcrypt from 'bcrypt';

const resolveDocumentType = (file: Express.Multer.File): string => {
  const originalName = file.originalname?.toLowerCase() ?? '';

  if (originalName.includes('passport')) return DOCUMENT_TYPE.PASSPORT;
  if (
    originalName.includes('trade') ||
    originalName.includes('license') ||
    originalName.includes('licence')
  ) {
    return DOCUMENT_TYPE.TRADE_LICENSE;
  }
  if (
    originalName.includes('business') ||
    originalName.includes('registration') ||
    originalName.includes('company')
  ) {
    return DOCUMENT_TYPE.BUSINESS_REGISTRATION;
  }

  return DOCUMENT_TYPE.NATIONAL_ID;
};

const joinAsSeller = async (
  payload: IJoinAsSeller,
  currentUser?: JwtPayload,
  files?: Express.Multer.File[],
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    let user: IUser | null = null;

    if (currentUser) {
      const email = currentUser.email;

      if (!email) {
        throw new AppError('User email is missing from token.', StatusCodes.UNAUTHORIZED);
      }

      user = await User.isUserExistByEmail(email);

      if (!user) {
        throw new AppError('User account not found.', StatusCodes.NOT_FOUND);
      }

      if (!user.isVerified) {
        throw new AppError(
          'Please verify your email before applying as a seller.',
          StatusCodes.UNAUTHORIZED,
        );
      }

      if (user.status !== USER_STATUS.ACTIVE) {
        throw new AppError('Your account is not active.', StatusCodes.FORBIDDEN);
      }

      if (user.role === USER_ROLE.SELLER) {
        throw new AppError('You are already a seller.', StatusCodes.CONFLICT);
      }

      const existingApplication = await JoinAsSeller.findOne({
        userId: user._id,
        status: JOIN_SELLER_STATUS.PENDING,
      }).session(session);

      if (existingApplication) {
        throw new AppError('You already have a pending seller application.', StatusCodes.CONFLICT);
      }
    } else {
      if (!payload.email) {
        throw new AppError('Email is required.', StatusCodes.BAD_REQUEST);
      }

      if (!payload.firstName || !payload.lastName) {
        throw new AppError('First name and last name are required.', StatusCodes.BAD_REQUEST);
      }

      const email = payload.email.trim().toLowerCase();
      const existingUser = await User.isUserExistByEmail(email);

      if (existingUser) {
        throw new AppError(
          'An account already exists with this email. Please login and apply as a seller.',
          StatusCodes.CONFLICT,
        );
      }

      const [createdUser] = await User.create(
        [
          {
            firstName: payload.firstName.trim(),
            lastName: payload.lastName.trim(),
            email,
            phone: payload.phone,
            role: USER_ROLE.CUSTOMER,
            status: USER_STATUS.ACTIVE,
            isVerified: false,
          },
        ],
        { session },
      );

      user = createdUser;
    }

    if (!files || files.length === 0) {
      throw new AppError('At least one business document is required.', StatusCodes.BAD_REQUEST);
    }

    const MAX_DOCUMENTS = 5;

    if (files.length > MAX_DOCUMENTS) {
      throw new AppError(
        `You can upload maximum ${MAX_DOCUMENTS} documents.`,
        StatusCodes.BAD_REQUEST,
      );
    }
    const uploadedDocuments = await Promise.all(
      files.map(async (file) => {
        if (!file || !file.path) {
          throw new AppError('One of the uploaded files is invalid.', StatusCodes.BAD_REQUEST);
        }

        const uploadedFile = await uploadToCloudinary(file.path, 'seller_documents');

        return {
          type: resolveDocumentType(file),
          publicId: uploadedFile.public_id,
          url: uploadedFile.secure_url,
        };
      }),
    );

    let businessAddress = payload.businessAddress;

    if (typeof businessAddress === 'string') {
      try {
        businessAddress = JSON.parse(businessAddress);
      } catch {
        throw new AppError('Invalid business address format.', StatusCodes.BAD_REQUEST);
      }
    }

    const [application] = await JoinAsSeller.create(
      [
        {
          userId: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          businessName: payload.businessName,
          businessType: payload.businessType,
          ownerName: payload.ownerName,
          phone: payload.phone,
          businessAddress,
          description: payload.description,
          documents: uploadedDocuments,
          status: JOIN_SELLER_STATUS.PENDING,
        },
      ],
      { session },
    );

    await session.commitTransaction();

    return {
      applicationId: application._id,
      status: application.status,

      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const getAllJoinAsSellerApplications = async (query: Record<string, unknown>) => {
  const searchableFields = ['businessName', 'ownerName', 'email'];

  return new QueryBuilder(JoinAsSeller, query)
    .search(searchableFields)
    .filter(['searchTerm', 'sortBy', 'sortOrder', 'page', 'limit'])
    .sort()
    .paginate()
    .populate({
      path: 'userId',
      select: 'firstName lastName email avatar',
    })
    .getPaginatedResult();
};

const getJoinAsSellerApplicationById = async (id: string) => {
  const application = await JoinAsSeller.findById(id).populate({
    path: 'userId',
    select: 'firstName lastName email avatar',
  });

  if (!application) {
    throw new AppError('Join as seller application not found.', StatusCodes.NOT_FOUND);
  }

  return application;
};

const SELLER_SETUP_TOKEN_EXPIRES_IN = 30 * 60 * 1000;

const updateJoinAsSellerApplicationStatus = async (
  id: string,
  status: TJoinSellerStatus,
  rejectionReason?: string,
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const application = await JoinAsSeller.findById(id).session(session);
    if (!application) {
      throw new AppError('Seller application not found.', StatusCodes.NOT_FOUND);
    }

    if (application.status !== JOIN_SELLER_STATUS.PENDING) {
      throw new AppError(
        `Application is already ${application.status.toLowerCase()}.`,
        StatusCodes.BAD_REQUEST,
      );
    }

    if (status === JOIN_SELLER_STATUS.REJECTED) {
      if (!rejectionReason?.trim()) {
        throw new AppError('Rejection reason is required.', StatusCodes.BAD_REQUEST);
      }

      application.status = JOIN_SELLER_STATUS.REJECTED;
      application.rejectionReason = rejectionReason.trim();

      await application.save({ session });
      await session.commitTransaction();

      // Email should happen after transaction
      await sendEmail({
        to: application.email,
        subject: 'Seller Application Update',
        html: sellerApplicationRejectedTemplate({
          firstName: application.firstName,
          businessName: application.businessName,
          rejectionReason: rejectionReason.trim(),
        }),
      });

      return application;
    }

    if (status === JOIN_SELLER_STATUS.APPROVED) {
      const user = await User.findById(application.userId).session(session);

      if (!user) {
        throw new AppError('Associated user account not found.', StatusCodes.NOT_FOUND);
      }

      if (user.role === USER_ROLE.SELLER) {
        throw new AppError('User is already a seller.', StatusCodes.CONFLICT);
      }

      const { rawToken, tokenHash } = generateSecureToken();

      const expiresAt = new Date(Date.now() + SELLER_SETUP_TOKEN_EXPIRES_IN);

      user.sellerOnboarding = {
        tokenHash,
        expiresAt,
        lastSentAt: new Date(),
        resendCount: 0,
      };

      await user.save({ session });

      application.status = JOIN_SELLER_STATUS.APPROVED;

      await application.save({ session });

      await session.commitTransaction();

      const setupUrl = `${config.SELLER_SETUP_URL}?token=${encodeURIComponent(rawToken)}`;

      await sendEmail({
        to: application.email,
        subject: 'Your Seller Application Has Been Approved',
        html: sellerApplicationApprovedTemplate({
          firstName: application.firstName,
          businessName: application.businessName,
          setupUrl,
        }),
      });

      return {
        applicationId: application._id,
        status: application.status,
      };
    }

    throw new AppError('Invalid application status.', StatusCodes.BAD_REQUEST);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const resendSellerSetupLink = async (email: string) => {
  const user = await User.findOne({
    email: email.toLowerCase().trim(),
  });

  if (!user) {
    return;
  }

  if (user.role === USER_ROLE.SELLER) {
    return;
  }

  const application = await JoinAsSeller.findOne({
    userId: user._id,
    status: JOIN_SELLER_STATUS.APPROVED,
  });

  if (!application) {
    return;
  }

  const now = Date.now();
  const lastSentAt = user.sellerOnboarding?.lastSentAt?.getTime() ?? 0;

  const resendCooldown = 5 * 60 * 1000;

  if (now - lastSentAt < resendCooldown) {
    throw new AppError(
      'Please wait before requesting another setup link.',
      StatusCodes.TOO_MANY_REQUESTS,
    );
  }

  const resendCount = user.sellerOnboarding?.resendCount ?? 0;

  if (resendCount >= 5) {
    throw new AppError(
      'You have reached the maximum number of setup link requests. Please contact support.',
      StatusCodes.TOO_MANY_REQUESTS,
    );
  }

  const { rawToken, tokenHash } = generateSecureToken();
  const expiresAt = new Date(now + 30 * 60 * 1000);

  user.sellerOnboarding = {
    tokenHash,
    expiresAt,
    lastSentAt: new Date(),
    resendCount: resendCount + 1,
  };

  await user.save();
  const setupUrl = `${config.SELLER_SETUP_URL}?token=${encodeURIComponent(rawToken)}`;

  await sendEmail({
    to: user.email,
    subject: 'Complete Your Seller Account Setup',
    html: sellerApplicationApprovedTemplate({
      firstName: user.firstName,
      businessName: application.businessName,
      setupUrl,
    }),
  });
};

const setupSellerPassword = async (token: string, newPassword: string) => {
  if (!token) {
    throw new AppError('Setup token is required.', StatusCodes.BAD_REQUEST);
  }

  if (!newPassword) {
    throw new AppError('Password is required.', StatusCodes.BAD_REQUEST);
  }

  if (newPassword.length < 8) {
    throw new AppError('Password must be at least 8 characters long.', StatusCodes.BAD_REQUEST);
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    'sellerOnboarding.tokenHash': tokenHash,
  });

  if (!user) {
    throw new AppError('Invalid or expired setup link.', StatusCodes.UNAUTHORIZED);
  }

  const onboarding = user.sellerOnboarding;

  if (!onboarding?.expiresAt || onboarding.expiresAt.getTime() < Date.now()) {
    throw new AppError('This setup link has expired. Please request a new one.', StatusCodes.GONE);
  }

  const application = await JoinAsSeller.findOne({
    userId: user._id,
    status: JOIN_SELLER_STATUS.APPROVED,
  });

  if (!application) {
    throw new AppError('Approved seller application not found.', StatusCodes.NOT_FOUND);
  }

  const hashedPassword = await bcrypt.hash(newPassword, Number(config.bcryptSaltRounds));

  user.password = hashedPassword;
  user.role = USER_ROLE.SELLER;
  user.isVerified = true;
  user.sellerOnboarding = undefined;

  await user.save();

  return {
    id: user._id,
    email: user.email,
    role: user.role,
  };
};

const JoinAsSellerService = {
  joinAsSeller,
  getAllJoinAsSellerApplications,
  getJoinAsSellerApplicationById,
  updateJoinAsSellerApplicationStatus,
  resendSellerSetupLink,
  setupSellerPassword,
};

export default JoinAsSellerService;
