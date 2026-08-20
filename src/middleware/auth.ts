import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import config from '../config';
import AppError from '../errors/AppError';
import { verifyToken } from '../utils/tokenGenerate';
import { TUserRole } from '../modules/user/user.interface';
import catchAsync from '../utils/catchAsync';

const extractToken = (req: Request): string | null => {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }
  return authorization.split(' ')[1] || null;
};

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', StatusCodes.UNAUTHORIZED));
  }

  const token = authorization.split(' ')[1];
  if (!token) {
    return next(new AppError('Authentication required', StatusCodes.UNAUTHORIZED));
  }

  try {
    const decoded = verifyToken(token, config.JWT_SECRET as string);
    req.user = decoded;

    next();
  } catch (error) {
    next(new AppError('Invalid or expired token', StatusCodes.UNAUTHORIZED));
  }
};

export const auth = (...allowedRoles: TUserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', StatusCodes.UNAUTHORIZED));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', StatusCodes.FORBIDDEN),
      );
    }

    next();
  };
};

export const optionalAuthenticate = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return next();
    }

    const decoded = verifyToken(token, config.JWT_SECRET as string);
    req.user = decoded;

    next();
  } catch {
    next();
  }
};

export const requireSuspensionAccess = catchAsync(async (req, res, next) => {
  if (req.user?.purpose !== 'SUSPENSION_APPEAL') {
    throw new AppError(
      'This endpoint is only available for suspended account appeal.',
      StatusCodes.FORBIDDEN,
    );
  }

  next();
});
