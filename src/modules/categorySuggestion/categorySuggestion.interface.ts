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

export enum CategorySuggestionAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  MAP = 'MAP',
  EDIT = 'EDIT',
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

export interface ICreateCategorySuggestion {
  name: string;
  parentId?: Types.ObjectId | null;
  description?: string;
}

export interface IReviewCategorySuggestion {
  action: CategorySuggestionAction;
  name?: string;
  parentId?: Types.ObjectId | null;
  description?: string;
  mappedCategoryId?: Types.ObjectId;
  adminNote?: string;
}
