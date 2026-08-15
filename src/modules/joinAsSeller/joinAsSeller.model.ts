import mongoose, { Schema } from 'mongoose';
import { IJoinAsSeller } from './joinAsSeller.interface';

const businessAddressSchema = new Schema(
  {
    street: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

const documentSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['NATIONAL_ID', 'PASSPORT', 'BUSINESS_LICENSE', 'TAX_ID'],
    },
    publicId: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

const joinAsSellerSchema = new Schema<IJoinAsSeller>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    businessName: {
      type: String,
      required: true,
      trim: true,
    },

    businessType: {
      type: String,
      required: true,
      trim: true,
    },

    ownerName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    businessAddress: {
      type: businessAddressSchema,
      required: true,
    },

    description: {
      type: String,
      trim: true,
    },

    documents: {
      type: [documentSchema],
      required: true,
      default: [],
    },

    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'],
      default: 'PENDING',
      required: true,
      index: true,
    },

    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export const JoinAsSeller = mongoose.model<IJoinAsSeller>('JoinAsSeller', joinAsSellerSchema);
