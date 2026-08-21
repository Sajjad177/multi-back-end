import { Types } from 'mongoose';

export enum CategorySuggestionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  MAPPED = 'MAPPED',
}

export enum CategorySuggestionSource {
  MANUAL = 'MANUAL',
  BULK_UPLOAD = 'BULK_UPLOAD',
}

export interface ICategorySuggestion {
  _id?: Types.ObjectId;
  name: string;
  parentId?: Types.ObjectId | null;
  description?: string;
  status: CategorySuggestionStatus;
  source: CategorySuggestionSource;
  suggestedBy: Types.ObjectId;
  mappedCategoryId?: Types.ObjectId;
  adminNote?: string;
  reviewedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
