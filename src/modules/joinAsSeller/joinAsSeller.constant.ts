export const JOIN_SELLER_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
} as const;

export type TJoinSellerStatus = (typeof JOIN_SELLER_STATUS)[keyof typeof JOIN_SELLER_STATUS];

export const BUSINESS_TYPE = {
  INDIVIDUAL: 'INDIVIDUAL',
  COMPANY: 'COMPANY',
  PARTNERSHIP: 'PARTNERSHIP',
} as const;

export type TBusinessType = (typeof BUSINESS_TYPE)[keyof typeof BUSINESS_TYPE];

export const DOCUMENT_TYPE = {
  NATIONAL_ID: 'NATIONAL_ID',
  TRADE_LICENSE: 'TRADE_LICENSE',
  BUSINESS_REGISTRATION: 'BUSINESS_REGISTRATION',
  PASSPORT: 'PASSPORT',
} as const;

export type TDocumentType = (typeof DOCUMENT_TYPE)[keyof typeof DOCUMENT_TYPE];
