import { Types } from 'mongoose';

export interface ICategory {
  _id?: Types.ObjectId;
  name: string;
  slug: string;
  parentId?: Types.ObjectId | null;
  description?: string;
  image?: {
    publicId: string;
    url: string;
  };
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUpdateCategory {
  name?: string;
  parentId?: Types.ObjectId | null;
  description?: string;
}
