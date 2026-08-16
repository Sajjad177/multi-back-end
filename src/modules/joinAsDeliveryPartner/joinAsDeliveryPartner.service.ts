import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';
import * as crypto from 'node:crypto';
import config from '../../config';
import AppError from '../../errors/AppError';
import { generateSecureToken } from '../../helper/generateSecureToken';
import QueryBuilder from '../../helper/QueryBuilder';
import { deleteFromCloudinary, uploadToCloudinary } from '../../utils/cloudinary';
import deliveryPartnerApplicationApprovedTemplate from '../../utils/deliveryPartnerApplicationApprovedTemplate';
import deliveryPartnerApplicationRejectedTemplate from '../../utils/deliveryPartnerApplicationRejectedTemplate';
import sendEmail from '../../utils/sendEmail';
import { APPLICATION_STATUS } from '../applications/application.constant';
import { USER_ROLE, USER_STATUS } from '../user/user.constant';
import { IUser } from '../user/user.interface';
import { User } from '../user/user.model';
import { TJoinDeliveryPartnerStatus } from './joinAsDeliveryPartner.constant';
import { JoinAsDeliveryPartner } from './joinAsDeliveryPartner.model';

const resolveDocumentType = (file: Express.Multer.File): string => {
  const originalName = file.originalname?.toLowerCase() ?? '';

  if (originalName.includes('license') || originalName.includes('licence'))
    return 'DRIVING_LICENSE';
  if (originalName.includes('national') || originalName.includes('id')) return 'NATIONAL_ID';
  if (originalName.includes('vehicle') || originalName.includes('registration')) {
    return 'VEHICLE_REGISTRATION';
  }

  return 'OTHER';
};

const joinAsDeliveryPartner = async (
  payload: any,
  currentUser?: JwtPayload,
  files?: Express.Multer.File[],
) => {
  const session = await mongoose.startSession();
  let uploadedDocuments: Array<{ type: string; publicId: string; url: string }> = [];

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
          'Please verify your email before applying as a delivery partner.',
          StatusCodes.UNAUTHORIZED,
        );
      }

      if (user.status !== USER_STATUS.ACTIVE) {
        throw new AppError('Your account is not active.', StatusCodes.FORBIDDEN);
      }

      if (user.role === USER_ROLE.DELIVERY_PARTNER) {
        throw new AppError('You are already a delivery partner.', StatusCodes.CONFLICT);
      }

      const existingApplication = await JoinAsDeliveryPartner.findOne({
        userId: user._id,
        status: APPLICATION_STATUS.PENDING,
      }).session(session);

      if (existingApplication) {
        throw new AppError(
          'You already have a pending delivery partner application.',
          StatusCodes.CONFLICT,
        );
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
          'An account already exists with this email. Please login and apply as a delivery partner.',
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
      throw new AppError('At least one document is required.', StatusCodes.BAD_REQUEST);
    }

    const MAX_DOCUMENTS = 5;

    if (files.length > MAX_DOCUMENTS) {
      throw new AppError(
        `You can upload maximum ${MAX_DOCUMENTS} documents.`,
        StatusCodes.BAD_REQUEST,
      );
    }

    uploadedDocuments = await Promise.all(
      files.map(async (file) => {
        if (!file || !file.path) {
          throw new AppError('One of the uploaded files is invalid.', StatusCodes.BAD_REQUEST);
        }

        const uploadedFile = await uploadToCloudinary(file.path, 'delivery_partner_documents');

        return {
          type: resolveDocumentType(file),
          publicId: uploadedFile.public_id,
          url: uploadedFile.secure_url,
        };
      }),
    );

    if (typeof payload.address === 'string') {
      try {
        payload.address = JSON.parse(payload.address);
      } catch {
        throw new AppError('Invalid address format.', StatusCodes.BAD_REQUEST);
      }
    }

    const [application] = await JoinAsDeliveryPartner.create(
      [
        {
          userId: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: payload.phone,
          address: payload.address,
          vehicleType: payload.vehicleType,
          vehicleNumber: payload.vehicleNumber,
          vehicleModel: payload.vehicleModel,
          vehicleOwnership: payload.vehicleOwnership,
          drivingLicenseNumber: payload.drivingLicenseNumber,
          description: payload.description,
          documents: uploadedDocuments,
          status: APPLICATION_STATUS.PENDING,
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

    if (uploadedDocuments.length > 0) {
      await Promise.allSettled(
        uploadedDocuments.map((document) => deleteFromCloudinary(document.publicId)),
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }
};

const getAllJoinAsDeliveryPartnerApplications = async (query: Record<string, unknown>) => {
  const searchableFields = ['firstName', 'lastName', 'email', 'phone', 'vehicleNumber'];

  return new QueryBuilder(JoinAsDeliveryPartner, query)
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

const getJoinAsDeliveryPartnerApplicationById = async (id: string) => {
  const application = await JoinAsDeliveryPartner.findById(id).populate({
    path: 'userId',
    select: 'firstName lastName email avatar',
  });

  if (!application) {
    throw new AppError('Delivery partner application not found.', StatusCodes.NOT_FOUND);
  }

  return application;
};

const SELLER_SETUP_TOKEN_EXPIRES_IN = 30 * 60 * 1000;

const updateJoinAsDeliveryPartnerApplicationStatus = async (
  id: string,
  status: TJoinDeliveryPartnerStatus,
  rejectionReason?: string,
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const application = await JoinAsDeliveryPartner.findById(id).session(session);
    if (!application) {
      throw new AppError('Delivery partner application not found.', StatusCodes.NOT_FOUND);
    }

    if (application.status !== APPLICATION_STATUS.PENDING) {
      throw new AppError(
        `Application is already ${application.status.toLowerCase()}.`,
        StatusCodes.BAD_REQUEST,
      );
    }

    if (status === APPLICATION_STATUS.REJECTED) {
      if (!rejectionReason?.trim()) {
        throw new AppError('Rejection reason is required.', StatusCodes.BAD_REQUEST);
      }

      application.status = APPLICATION_STATUS.REJECTED;
      application.rejectionReason = rejectionReason.trim();

      await application.save({ session });
      await session.commitTransaction();

      await sendEmail({
        to: application.email,
        subject: 'Delivery Partner Application Update',
        html: deliveryPartnerApplicationRejectedTemplate({
          firstName: application.firstName,
          rejectionReason: rejectionReason.trim(),
        }),
      });

      return application;
    }

    if (status === APPLICATION_STATUS.APPROVED) {
      const user = await User.findById(application.userId).session(session);

      if (!user) {
        throw new AppError('Associated user account not found.', StatusCodes.NOT_FOUND);
      }

      if (user.role === USER_ROLE.DELIVERY_PARTNER) {
        throw new AppError('User is already a delivery partner.', StatusCodes.CONFLICT);
      }

      const { rawToken, tokenHash } = generateSecureToken();
      const expiresAt = new Date(Date.now() + SELLER_SETUP_TOKEN_EXPIRES_IN);

      user.deliveryPartnerOnboarding = {
        tokenHash,
        expiresAt,
        lastSentAt: new Date(),
        resendCount: 0,
      };

      await user.save({ session });

      application.status = APPLICATION_STATUS.APPROVED;
      await application.save({ session });

      await session.commitTransaction();

      const setupUrl = `${config.SELLER_SETUP_URL}?token=${encodeURIComponent(rawToken)}`;

      await sendEmail({
        to: application.email,
        subject: 'Your Delivery Partner Application Has Been Approved',
        html: deliveryPartnerApplicationApprovedTemplate({
          firstName: application.firstName,
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

const resendDeliveryPartnerSetupLink = async (email: string) => {
  const user = await User.findOne({
    email: email.toLowerCase().trim(),
  });

  if (!user) {
    return;
  }

  if (user.role === USER_ROLE.DELIVERY_PARTNER) {
    return;
  }

  const application = await JoinAsDeliveryPartner.findOne({
    userId: user._id,
    status: APPLICATION_STATUS.APPROVED,
  });

  if (!application) {
    return;
  }

  const now = Date.now();
  const lastSentAt = user.deliveryPartnerOnboarding?.lastSentAt?.getTime() ?? 0;
  const resendCooldown = 5 * 60 * 1000;

  if (now - lastSentAt < resendCooldown) {
    throw new AppError(
      'Please wait before requesting another setup link.',
      StatusCodes.TOO_MANY_REQUESTS,
    );
  }

  const resendCount = user.deliveryPartnerOnboarding?.resendCount ?? 0;

  if (resendCount >= 5) {
    throw new AppError(
      'You have reached the maximum number of setup link requests. Please contact support.',
      StatusCodes.TOO_MANY_REQUESTS,
    );
  }

  const { rawToken, tokenHash } = generateSecureToken();
  const expiresAt = new Date(now + 30 * 60 * 1000);

  user.deliveryPartnerOnboarding = {
    tokenHash,
    expiresAt,
    lastSentAt: new Date(),
    resendCount: resendCount + 1,
  };

  await user.save();

  const setupUrl = `${config.SELLER_SETUP_URL}?token=${encodeURIComponent(rawToken)}`;

  await sendEmail({
    to: user.email,
    subject: 'Complete Your Delivery Partner Account Setup',
    html: deliveryPartnerApplicationApprovedTemplate({
      firstName: user.firstName,
      setupUrl,
    }),
  });
};

const setupDeliveryPartnerPassword = async (token: string, newPassword: string) => {
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
    'deliveryPartnerOnboarding.tokenHash': tokenHash,
  });

  if (!user) {
    throw new AppError('Invalid or expired setup link.', StatusCodes.UNAUTHORIZED);
  }

  const onboarding = user.deliveryPartnerOnboarding;

  if (!onboarding?.expiresAt || onboarding.expiresAt.getTime() < Date.now()) {
    throw new AppError('This setup link has expired. Please request a new one.', StatusCodes.GONE);
  }

  const application = await JoinAsDeliveryPartner.findOne({
    userId: user._id,
    status: APPLICATION_STATUS.APPROVED,
  });

  if (!application) {
    throw new AppError('Approved delivery partner application not found.', StatusCodes.NOT_FOUND);
  }

  const hashedPassword = await bcrypt.hash(newPassword, Number(config.bcryptSaltRounds));

  user.password = hashedPassword;
  user.role = USER_ROLE.DELIVERY_PARTNER;
  user.isVerified = true;
  user.deliveryPartnerOnboarding = undefined;

  await user.save();

  return {
    id: user._id,
    email: user.email,
    role: user.role,
  };
};

const JoinAsDeliveryPartnerService = {
  joinAsDeliveryPartner,
  getAllJoinAsDeliveryPartnerApplications,
  getJoinAsDeliveryPartnerApplicationById,
  updateJoinAsDeliveryPartnerApplicationStatus,
  resendDeliveryPartnerSetupLink,
  setupDeliveryPartnerPassword,
};

export default JoinAsDeliveryPartnerService;
