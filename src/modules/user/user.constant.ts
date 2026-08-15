export const USER_ROLE = {
  CUSTOMER: 'customer',
  SELLER: 'seller',
  DELIVERY_PARTNER: 'delivery_partner',
  ADMIN: 'admin',
} as const;

export const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  BLOCKED: 'blocked',
} as const;

export type TUserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];
