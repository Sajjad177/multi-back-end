import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import fs from 'fs';
import AppError from '../../errors/AppError';
import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/cloudinary';
import { USER_ROLE, USER_STATUS } from '../user/user.constant';
import { User } from '../user/user.model';
import { SUSPENSION_ERROR_MESSAGES } from './suspension.constant';
import {
  AppealStatus,
  SuspensionStatus,
  SuspensionType,
  SuspensionUserRole,
} from './suspension.interface';
import { Suspension } from './suspension.model';
import sendEmail from '../../utils/sendEmail';
import suspensionTemplate from '../../utils/suspensionTamplate';
import QueryBuilder from '../../helper/QueryBuilder';

interface ISuspendUserPayload {
  userId: string;
  type: SuspensionType;
  reason: string;
  description?: string;
  expiresAt?: string;
}

const suspendUser = async (payload: ISuspendUserPayload) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // 1. Find and validate the user
    const user = await User.findById(payload.userId).session(session);

    if (!user) {
      throw new AppError(SUSPENSION_ERROR_MESSAGES.USER_NOT_FOUND, StatusCodes.NOT_FOUND);
    }

    // 2. Validate user role
    if (user.role === USER_ROLE.ADMIN) {
      throw new AppError(
        SUSPENSION_ERROR_MESSAGES.ADMIN_CANNOT_BE_SUSPENDED,
        StatusCodes.FORBIDDEN,
      );
    }

    const supportedRoles = [USER_ROLE.CUSTOMER, USER_ROLE.SELLER, USER_ROLE.DELIVERY_PARTNER];
    if (!supportedRoles.includes(user.role)) {
      throw new AppError(SUSPENSION_ERROR_MESSAGES.UNSUPPORTED_ROLE, StatusCodes.BAD_REQUEST);
    }

    // 3. Check current user status
    if (user.status === USER_STATUS.SUSPENDED) {
      throw new AppError(SUSPENSION_ERROR_MESSAGES.ALREADY_SUSPENDED, StatusCodes.CONFLICT);
    }

    if (user.status === USER_STATUS.BLOCKED) {
      throw new AppError(SUSPENSION_ERROR_MESSAGES.USER_BLOCKED, StatusCodes.CONFLICT);
    }

    // 4. Check if an active suspension already exists
    const existingActiveSuspension = await Suspension.findOne({
      userId: user._id,
      status: SuspensionStatus.ACTIVE,
    }).session(session);

    if (existingActiveSuspension) {
      throw new AppError(SUSPENSION_ERROR_MESSAGES.ACTIVE_SUSPENSION_EXISTS, StatusCodes.CONFLICT);
    }

    // 5. Determine userRole for suspension record
    let suspensionUserRole: SuspensionUserRole;
    if (user.role === USER_ROLE.CUSTOMER) {
      suspensionUserRole = SuspensionUserRole.CUSTOMER;
    } else if (user.role === USER_ROLE.SELLER) {
      suspensionUserRole = SuspensionUserRole.SELLER;
    } else {
      suspensionUserRole = SuspensionUserRole.DELIVERY_PARTNER;
    }

    // 6. Prepare suspension data
    const suspensionData = {
      userId: user._id,
      userRole: suspensionUserRole,
      type: payload.type,
      reason: payload.reason.trim(),
      description: payload.description?.trim(),
      status: SuspensionStatus.ACTIVE,
      suspendedAt: new Date(),
      appealStatus: AppealStatus.NONE,
    } as any;

    // Add expiresAt only for TEMPORARY suspensions
    if (payload.type === SuspensionType.TEMPORARY && payload.expiresAt) {
      suspensionData.expiresAt = new Date(payload.expiresAt);
    }

    // 7. Create suspension record
    const suspension = await Suspension.create([suspensionData], { session });

    if (!suspension || suspension.length === 0) {
      throw new AppError('Failed to create suspension record', StatusCodes.INTERNAL_SERVER_ERROR);
    }

    // 8. Update user status to SUSPENDED
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: { status: USER_STATUS.SUSPENDED } },
      { new: true, session },
    );

    if (!updatedUser || updatedUser.status !== USER_STATUS.SUSPENDED) {
      throw new AppError('Failed to update user status', StatusCodes.INTERNAL_SERVER_ERROR);
    }

    // 9. Commit transaction
    await session.commitTransaction();

    return suspension[0];
  } catch (error) {
    // Rollback transaction on error
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const submitAppeal = async (
  suspensionId: string,
  authUser: { sub: string; role: string; email: string },
  appealDescription: string,
  files?: Express.Multer.File[],
) => {
  // 1. Validate suspensionId format
  if (!/^[0-9a-fA-F]{24}$/.test(suspensionId)) {
    throw new AppError(SUSPENSION_ERROR_MESSAGES.INVALID_SUSPENSION_ID, StatusCodes.BAD_REQUEST);
  }

  // 2. Find the suspension
  const suspension = await Suspension.findById(suspensionId);

  // 3. Suspension must exist
  if (!suspension) {
    throw new AppError(SUSPENSION_ERROR_MESSAGES.SUSPENSION_NOT_FOUND, StatusCodes.NOT_FOUND);
  }

  // 4. Authenticated user must own the suspension
  if (suspension.userId.toString() !== authUser.sub) {
    throw new AppError(SUSPENSION_ERROR_MESSAGES.FORBIDDEN_APPEAL, StatusCodes.FORBIDDEN);
  }

  // 5. Verify role consistency
  const mappedRoleMap: Record<string, string> = {
    customer: SuspensionUserRole.CUSTOMER,
    seller: SuspensionUserRole.SELLER,
    delivery_partner: SuspensionUserRole.DELIVERY_PARTNER,
  };
  const mappedRole = mappedRoleMap[authUser.role];
  if (!mappedRole || mappedRole !== suspension.userRole) {
    throw new AppError(SUSPENSION_ERROR_MESSAGES.INCONSISTENT_ROLE, StatusCodes.FORBIDDEN);
  }

  // 6. Verify suspension status is ACTIVE
  if (suspension.status !== SuspensionStatus.ACTIVE) {
    throw new AppError(SUSPENSION_ERROR_MESSAGES.SUSPENSION_NOT_ACTIVE, StatusCodes.BAD_REQUEST);
  }

  // 7. Verify current user is SUSPENDED
  const user = await User.findById(authUser.sub);
  if (!user) {
    throw new AppError(SUSPENSION_ERROR_MESSAGES.USER_NOT_FOUND, StatusCodes.NOT_FOUND);
  }
  if (user.status !== USER_STATUS.SUSPENDED) {
    throw new AppError(SUSPENSION_ERROR_MESSAGES.USER_NOT_SUSPENDED, StatusCodes.BAD_REQUEST);
  }

  // 8. Verify appealStatus is NONE
  if (suspension.appealStatus === AppealStatus.PENDING) {
    throw new AppError(SUSPENSION_ERROR_MESSAGES.APPEAL_ALREADY_PENDING, StatusCodes.CONFLICT);
  }
  if (suspension.appealStatus !== AppealStatus.NONE) {
    throw new AppError(SUSPENSION_ERROR_MESSAGES.APPEAL_ALREADY_SUBMITTED, StatusCodes.CONFLICT);
  }

  // 9. Upload documents
  const uploadedDocuments: { url: string; publicId?: string; name?: string }[] = [];
  if (files && files.length > 0) {
    try {
      for (const file of files) {
        if (!file || !file.path) {
          throw new AppError('One of the uploaded files is invalid.', StatusCodes.BAD_REQUEST);
        }
        const uploadedFile = await uploadToCloudinary(file.path, 'appeal_documents');
        uploadedDocuments.push({
          url: uploadedFile.secure_url,
          publicId: uploadedFile.public_id,
          name: file.originalname,
        });
      }
    } catch (error) {
      // Clean up successfully uploaded files from Cloudinary
      if (uploadedDocuments.length > 0) {
        await Promise.allSettled(
          uploadedDocuments.map((doc) => {
            if (doc.publicId) {
              return deleteFromCloudinary(doc.publicId);
            }
            return Promise.resolve();
          }),
        );
      }
      // Also delete remaining files from local disk
      for (const file of files) {
        if (file && file.path && fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (err) {
            // Ignore local unlink errors
          }
        }
      }
      throw error;
    }
  }

  // 10. Update appeal fields
  suspension.appealStatus = AppealStatus.PENDING;
  suspension.appealDescription = appealDescription;
  suspension.appealedAt = new Date();
  if (uploadedDocuments.length > 0) {
    suspension.appealDocuments = uploadedDocuments;
  }

  await suspension.save();

  return suspension;
};

const toggleAppealStatus = async (
  suspensionId: string,
  status: AppealStatus.APPROVED | AppealStatus.REJECTED,
  reviewNote: string,
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // -----------------------------------------
    // 1. Validate suspension ID
    // -----------------------------------------

    if (!mongoose.Types.ObjectId.isValid(suspensionId)) {
      throw new AppError(SUSPENSION_ERROR_MESSAGES.INVALID_SUSPENSION_ID, StatusCodes.BAD_REQUEST);
    }

    // -----------------------------------------
    // 2. Validate decision
    // -----------------------------------------

    if (status !== AppealStatus.APPROVED && status !== AppealStatus.REJECTED) {
      throw new AppError(
        'Invalid appeal status. Only APPROVED or REJECTED is allowed.',
        StatusCodes.BAD_REQUEST,
      );
    }

    // -----------------------------------------
    // 3. Find suspension
    // -----------------------------------------

    const suspension = await Suspension.findById(suspensionId).session(session);
    if (!suspension) {
      throw new AppError(SUSPENSION_ERROR_MESSAGES.SUSPENSION_NOT_FOUND, StatusCodes.NOT_FOUND);
    }

    // -----------------------------------------
    // 4. Appeal must be PENDING
    // -----------------------------------------

    if (suspension.appealStatus !== AppealStatus.PENDING) {
      throw new AppError('Only pending appeals can be approved or rejected.', StatusCodes.CONFLICT);
    }

    // -----------------------------------------
    // 5. Suspension must still be ACTIVE
    // -----------------------------------------

    if (suspension.status !== SuspensionStatus.ACTIVE) {
      throw new AppError(SUSPENSION_ERROR_MESSAGES.SUSPENSION_NOT_ACTIVE, StatusCodes.CONFLICT);
    }

    // -----------------------------------------
    // 6. Find user
    // -----------------------------------------

    const user = await User.findById(suspension.userId).session(session);
    if (!user) {
      throw new AppError(SUSPENSION_ERROR_MESSAGES.USER_NOT_FOUND, StatusCodes.NOT_FOUND);
    }

    // -----------------------------------------
    // 7. Update based on admin decision
    // -----------------------------------------

    if (status === AppealStatus.APPROVED) {
      // User gets account back
      user.status = USER_STATUS.ACTIVE;

      suspension.appealStatus = AppealStatus.APPROVED;

      // Suspension itself is lifted
      suspension.status = SuspensionStatus.LIFTED;

      suspension.liftedAt = new Date();
    }

    if (status === AppealStatus.REJECTED) {
      // User remains suspended
      user.status = USER_STATUS.SUSPENDED;

      suspension.appealStatus = AppealStatus.REJECTED;

      // IMPORTANT:
      // Suspension remains ACTIVE
      suspension.status = SuspensionStatus.ACTIVE;
    }

    // -----------------------------------------
    // 8. Save review information
    // -----------------------------------------

    suspension.appealReviewNote = reviewNote;
    suspension.appealReviewedAt = new Date();

    await user.save({ session });
    await suspension.save({ session });

    // -----------------------------------------
    // 9. Commit transaction
    // -----------------------------------------

    await session.commitTransaction();

    // -----------------------------------------
    // 10. Send email AFTER transaction commit
    // -----------------------------------------

    const email = suspensionTemplate({
      userName: `${user.firstName} ${user.lastName}`,
      status,
      reviewNote,
    });

    try {
      await sendEmail({
        to: user.email,
        subject: email.subject,
        html: email.html,
      });
    } catch (emailError) {
      // Email failure must NOT rollback the successful
      // suspension decision.
      console.error('Suspension appeal review email failed:', emailError);
    }

    // -----------------------------------------
    // 11. Return updated suspension
    // -----------------------------------------

    return suspension;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const getAllSuspensions = async (query: Record<string, unknown>) => {
  const searchableFields = ['firstName', 'lastName', 'ownerName', 'email'];

  return new QueryBuilder(Suspension, query)
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

const getSuspensionById = async (suspensionId: string) => {
  const suspension = await Suspension.findById(suspensionId).populate(
    'userId',
    'firstName lastName email role status',
  );

  if (!suspension) {
    throw new AppError(SUSPENSION_ERROR_MESSAGES.SUSPENSION_NOT_FOUND, StatusCodes.NOT_FOUND);
  }

  return suspension;
};

const suspensionService = {
  suspendUser,
  submitAppeal,
  toggleAppealStatus,
  getAllSuspensions,
  getSuspensionById,
};

export default suspensionService;
