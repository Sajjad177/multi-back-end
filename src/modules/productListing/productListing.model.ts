import mongoose, { Schema } from 'mongoose';
import { DISCOUNT_TYPE, IProductListing, LISTING_STATUS } from './productListing.interface';

const quantityOptionSchema = new Schema(
  {
    quantity: {
      type: Number,
      required: true,
      min: 0.01,
    },

    price: {
      type: Number,
      required: true,
      min: 0.01,
    },
  },
  {
    _id: false,
  },
);

const discountSchema = new Schema(
  {
    type: {
      type: String,
      enum: Object.values(DISCOUNT_TYPE),
      required: true,
    },

    value: {
      type: Number,
      required: true,
      min: 0,
    },

    startsAt: {
      type: Date,
    },

    endsAt: {
      type: Date,
    },
  },
  {
    _id: false,
  },
);

const productListingSchema = new Schema<IProductListing>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },

    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },

    quantityOptions: {
      type: [quantityOptionSchema],
      default: [],
    },

    discount: {
      type: discountSchema,
      required: false,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    allowCustomQuantity: {
      type: Boolean,
      required: true,
      default: false,
    },

    minOrderQuantity: {
      type: Number,
      min: 0.01,
    },

    maxOrderQuantity: {
      type: Number,
      min: 0.01,
    },

    status: {
      type: String,
      enum: Object.values(LISTING_STATUS),
      required: true,
      default: LISTING_STATUS.ACTIVE,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

productListingSchema.index({ productId: 1, sellerId: 1 }, { unique: true });
productListingSchema.index({ sellerId: 1, status: 1 });
productListingSchema.index({ productId: 1, status: 1 });

export const ProductListing = mongoose.model<IProductListing>(
  'ProductListing',
  productListingSchema,
);
