import { Types } from 'mongoose';

export enum LISTING_STATUS {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
  SUSPENDED = 'suspended',
}

export enum DISCOUNT_TYPE {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export interface IQuantityOption {
  quantity: number;
  price: number;
}

export interface IDiscount {
  type: DISCOUNT_TYPE;
  value: number;
  startsAt?: Date;
  endsAt?: Date;
}

export interface IProductListing {
  _id?: Types.ObjectId;
  productId: Types.ObjectId;
  sellerId: Types.ObjectId;
  basePrice: number;
  quantityOptions: IQuantityOption[];
  discount?: IDiscount;
  stock: number;
  allowCustomQuantity: boolean;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  status: LISTING_STATUS;
  createdAt?: Date;
  updatedAt?: Date;
}
