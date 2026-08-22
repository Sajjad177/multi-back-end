import { Types } from 'mongoose';

export enum PRODUCT_STATUS {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum PRODUCT_UNIT {
  KG = 'kg',
  GRAM = 'gram',
  LITER = 'liter',
  ML = 'ml',
  PIECE = 'piece',
}

export interface IProductImage {
  publicId: string;
  url: string;
}

export interface IProduct {
  _id?: Types.ObjectId;
  name: string;
  slug: string;
  categoryId: Types.ObjectId;
  description?: string;
  images: IProductImage[];
  unit: PRODUCT_UNIT;
  status: PRODUCT_STATUS;
  createdAt?: Date;
  updatedAt?: Date;
}
