import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import config from '../config';
import AppError from '../errors/AppError';
import { verifyToken } from '../utils/tokenGenerate';
import { TUserRole } from '../modules/user/user.interface';

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
  } catch {
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
