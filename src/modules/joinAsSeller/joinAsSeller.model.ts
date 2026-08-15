import mongoose, { Schema } from 'mongoose';
import { IJoinAsSeller } from './joinAsSeller.interface';
import { BUSINESS_TYPE, DOCUMENT_TYPE, JOIN_SELLER_STATUS } from './joinAsSeller.constant';

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
      enum: Object.values(DOCUMENT_TYPE),
      required: true,
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

    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    businessType: {
      type: String,
      enum: Object.values(BUSINESS_TYPE),
      required: true,
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
      enum: Object.values(JOIN_SELLER_STATUS),
      default: JOIN_SELLER_STATUS.PENDING,
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const JoinAsSeller = mongoose.model<IJoinAsSeller>('JoinAsSeller', joinAsSellerSchema);
