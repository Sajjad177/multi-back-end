import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';
import AppError from '../../errors/AppError';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { USER_ROLE, USER_STATUS } from '../user/user.constant';
import { IUser } from '../user/user.interface';
import { User } from '../user/user.model';
import { DOCUMENT_TYPE, JOIN_SELLER_STATUS } from './joinAsSeller.constant';
import { IJoinAsSeller } from './joinAsSeller.interface';
import { JoinAsSeller } from './joinAsSeller.model';

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

const JoinAsSellerService = {
  joinAsSeller,
};

export default JoinAsSellerService;
