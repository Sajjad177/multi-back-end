import mongoose, { Model } from 'mongoose';
import { TUserStatus, USER_ROLE } from './user.constant';

export interface IUser {
  _id: mongoose.Types.ObjectId;

  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string;
  dateOfBirth?: Date;
  avatar?: {
    publicId: string;
    url: string;
  };
  role: TUserRole;
  status: TUserStatus;
  isVerified: boolean;
  emailVerification?: {
    otpHash?: string;
    expiresAt?: Date;
    attempts: number;
    lastSentAt?: Date;
  };
  passwordReset?: {
    otpHash?: string;
    expiresAt?: Date;
    attempts: number;
  };
  lastLoginAt?: Date;
  passwordChangedAt?: Date;
  sellerOnboarding?: {
    tokenHash?: string;
    expiresAt?: Date;
    lastSentAt?: Date;
    resendCount?: number;
  };
  deliveryPartnerOnboarding?: {
    tokenHash?: string;
    expiresAt?: Date;
    lastSentAt?: Date;
    resendCount?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserModel extends Model<IUser> {
  isPasswordMatch(password: string, hashedPassword: string): Promise<boolean>;
  isUserExistByEmail(email: string): Promise<IUser | null>;
  isUserExistByEmailWithPassword(email: string): Promise<IUser | null>;
  isUserExistById(_id: string): Promise<IUser | null>;
  isUserExistByIdWithPassword(_id: string): Promise<IUser | null>;
}

export type TUserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];
