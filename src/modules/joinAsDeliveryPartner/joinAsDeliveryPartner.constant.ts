export const JOIN_DELIVERY_PARTNER_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type TJoinDeliveryPartnerStatus =
  (typeof JOIN_DELIVERY_PARTNER_STATUS)[keyof typeof JOIN_DELIVERY_PARTNER_STATUS];

export const DELIVERY_VEHICLE_TYPE = {
  BIKE: 'BIKE',
  CAR: 'CAR',
  VAN: 'VAN',
  TRUCK: 'TRUCK',
  SCOOTER: 'SCOOTER',
} as const;

export type TDeliveryVehicleType =
  (typeof DELIVERY_VEHICLE_TYPE)[keyof typeof DELIVERY_VEHICLE_TYPE];

export const VEHICLE_OWNERSHIP = {
  OWNED: 'OWNED',
  LEASED: 'LEASED',
} as const;

export type TVehicleOwnership = (typeof VEHICLE_OWNERSHIP)[keyof typeof VEHICLE_OWNERSHIP];
