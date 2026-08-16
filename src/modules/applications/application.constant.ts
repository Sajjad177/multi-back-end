export const APPLICATION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type TApplicationStatus = (typeof APPLICATION_STATUS)[keyof typeof APPLICATION_STATUS];
