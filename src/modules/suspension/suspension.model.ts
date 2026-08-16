import { Schema, model } from 'mongoose';
import {
  ISuspension,
  SuspensionUserRole,
  SuspensionType,
  SuspensionStatus,
  AppealStatus,
} from './suspension.interface';

const suspensionSchema = new Schema<ISuspension>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userRole: {
      type: String,
      enum: Object.values(SuspensionUserRole),
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(SuspensionType),
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(SuspensionStatus),
      default: SuspensionStatus.ACTIVE,
      index: true,
    },
    suspendedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
    },
    appealStatus: {
      type: String,
      enum: Object.values(AppealStatus),
      default: AppealStatus.NONE,
    },
    appealDescription: {
      type: String,
      trim: true,
    },
    appealDocuments: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
        },
        name: {
          type: String,
        },
      },
    ],
    appealedAt: {
      type: Date,
    },
    appealReviewedAt: {
      type: Date,
    },
    appealReviewNote: {
      type: String,
      trim: true,
    },
    liftedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Suspension = model<ISuspension>('Suspension', suspensionSchema);
