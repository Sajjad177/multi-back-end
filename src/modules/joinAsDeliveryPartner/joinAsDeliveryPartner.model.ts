import mongoose, { Schema } from 'mongoose';
import {
  DELIVERY_VEHICLE_TYPE,
  JOIN_DELIVERY_PARTNER_STATUS,
  VEHICLE_OWNERSHIP,
} from './joinAsDeliveryPartner.constant';
import { IDeliveryPartnerApplication } from './joinAsDeliveryPartner.interface';

const deliveryAddressSchema = new Schema(
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

const deliveryDocumentSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true,
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

const deliveryPartnerApplicationSchema = new Schema<IDeliveryPartnerApplication>(
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
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: deliveryAddressSchema,
      required: true,
    },
    vehicleType: {
      type: String,
      enum: Object.values(DELIVERY_VEHICLE_TYPE),
      required: true,
    },
    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    vehicleModel: {
      type: String,
      required: true,
      trim: true,
    },
    vehicleOwnership: {
      type: String,
      enum: Object.values(VEHICLE_OWNERSHIP),
      required: true,
    },
    drivingLicenseNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    documents: {
      type: [deliveryDocumentSchema],
      required: true,
      default: [],
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(JOIN_DELIVERY_PARTNER_STATUS),
      default: JOIN_DELIVERY_PARTNER_STATUS.PENDING,
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

export const JoinAsDeliveryPartner = mongoose.model<IDeliveryPartnerApplication>(
  'JoinAsDeliveryPartner',
  deliveryPartnerApplicationSchema,
);
