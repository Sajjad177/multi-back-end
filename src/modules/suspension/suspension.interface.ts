import { Types } from 'mongoose';

export enum SuspensionUserRole {
  CUSTOMER = 'CUSTOMER',
  SELLER = 'SELLER',
  DELIVERY_PARTNER = 'DELIVERY_PARTNER',
}

export enum SuspensionType {
  TEMPORARY = 'TEMPORARY',
  PERMANENT = 'PERMANENT',
}

export enum SuspensionStatus {
  ACTIVE = 'ACTIVE',
  LIFTED = 'LIFTED',
  EXPIRED = 'EXPIRED',
}

export enum AppealStatus {
  NONE = 'NONE',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface ISuspension {
  userId: Types.ObjectId;
  userRole: SuspensionUserRole;
  type: SuspensionType;
  reason: string;
  description?: string;
  status: SuspensionStatus;
  suspendedAt: Date;
  expiresAt?: Date;
  appealStatus: AppealStatus;
  appealDescription?: string;
  appealDocuments?: {
    url: string;
    publicId?: string;
    name?: string;
  }[];
  appealedAt?: Date;
  appealReviewedAt?: Date;
  appealReviewNote?: string;
  liftedAt?: Date;
}
