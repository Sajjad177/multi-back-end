import mongoose from 'mongoose';
import { TDocumentType } from './joinAsSeller.constant';

export type TJoinSellerStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface IJoinAsSeller {
  userId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  businessName: string;
  businessType: string;
  ownerName: string;
  phone: string;
  email: string;
  businessAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  description?: string;
  documents: {
    type: TDocumentType;
    publicId: string;
    url: string;
  }[];
  status: TJoinSellerStatus;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
