import mongoose from 'mongoose';
import { IApplicationDocument, IBaseApplication } from '../applications/application.interface';
import { TDeliveryVehicleType, TVehicleOwnership } from './joinAsDeliveryPartner.constant';

export interface IDeliveryPartnerAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface IDeliveryPartnerApplication extends IBaseApplication {
  userId: mongoose.Types.ObjectId;
  address: IDeliveryPartnerAddress;
  vehicleType: TDeliveryVehicleType;
  vehicleNumber: string;
  vehicleModel: string;
  vehicleOwnership: TVehicleOwnership;
  drivingLicenseNumber: string;
  documents: IApplicationDocument[];
  description?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
