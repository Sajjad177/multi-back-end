import bcrypt from 'bcrypt';
import { Response } from 'express';
import { JwtPayload, sign } from 'jsonwebtoken';
import mongoose from 'mongoose';
import config from '../config';
import { IUser } from '../modules/user/user.interface';
import { createToken, verifyToken } from '../utils/tokenGenerate';

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

export const verifyRefreshToken = (token: string): JwtPayload => {
  return verifyToken(token, config.refreshTokenSecret as string) as JwtPayload;
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

const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: config.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
  res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);
};

export const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie('refreshToken', refreshTokenCookieOptions);
};

interface ISuspensionTokenPayload {
  sub: mongoose.Types.ObjectId;
  role: string;
  purpose: 'SUSPENSION_APPEAL';
}

export const generateSuspensionToken = (user: { _id: mongoose.Types.ObjectId; role: string }) => {
  const payload: ISuspensionTokenPayload = {
    sub: user._id,
    role: user.role,
    purpose: 'SUSPENSION_APPEAL',
  };

  return sign(payload, config.JWT_SECRET as string, {
    expiresIn: '15m',
  });
};
