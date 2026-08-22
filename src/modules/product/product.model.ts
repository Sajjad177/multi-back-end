import { Schema, model } from 'mongoose';
import { IProduct, IProductImage, PRODUCT_STATUS, PRODUCT_UNIT } from './product.interface';

const productImageSchema = new Schema<IProductImage>(
  {
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

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },

    description: {
      type: String,
      trim: true,
    },

    images: {
      type: [productImageSchema],
      required: true,
      default: [],
    },

    unit: {
      type: String,
      enum: Object.values(PRODUCT_UNIT),
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(PRODUCT_STATUS),
      default: PRODUCT_STATUS.ACTIVE,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Product = model<IProduct>('Product', productSchema);
