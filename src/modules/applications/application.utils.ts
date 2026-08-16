import crypto from 'node:crypto';
import { generateSecureToken } from '../../helper/generateSecureToken';

export const hashTokenValue = (value: string) => {
  return crypto.createHash('sha256').update(value).digest('hex');
};

export const generateOnboardingToken = () => {
  const { rawToken, tokenHash } = generateSecureToken();

  return {
    rawToken,
    tokenHash,
  };
};
