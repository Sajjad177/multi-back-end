import mongoose from 'mongoose';
import { TApplicationStatus } from './application.constant';

export interface IApplicationDocument {
  type: string;
  publicId: string;
  url: string;
}

export interface IBaseApplication {
  userId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documents: IApplicationDocument[];
  status: TApplicationStatus;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
