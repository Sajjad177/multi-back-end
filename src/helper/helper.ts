import bcrypt from 'bcrypt';
import { Response } from 'express';
import config from '../config';
import { IUser } from '../modules/user/user.interface';
import { createToken } from '../utils/tokenGenerate';

export const generateTokens = (user: any) => {
  const tokenPayload = {
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const accessToken = createToken(
    tokenPayload,
    config.JWT_SECRET as string,
    config.JWT_EXPIRES_IN as string,
  );

  const refreshToken = createToken(
    tokenPayload,
    config.refreshTokenSecret as string,
    config.jwtRefreshTokenExpiresIn as string,
  );

  return {
    accessToken,
    refreshToken,
  };
};

export const generateOtp = async () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await bcrypt.hash(otp, 10);
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

  return {
    otp,
    hashedOtp,
    otpExpires,
  };
};

export const sanitizeUser = (user: IUser) => {
  return {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    role: user.role,
    status: user.status,
    isVerified: user.isVerified,
    dateOfBirth: user.dateOfBirth,
  };
};

export const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};
