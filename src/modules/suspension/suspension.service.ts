import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import AppError from '../../errors/AppError';
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

const suspensionService = {
  suspendUser,
};

export default suspensionService;
