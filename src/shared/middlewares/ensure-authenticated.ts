import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AppError } from '../errors/app-error';
import { TokenPayload } from '../../@types/express';
import { Role } from '@prisma/client';

export function ensureAuthenticated(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError('JWT token is missing', 401);
  }

  const [, token] = authHeader.split(' ');

  if (!token) {
    throw new AppError('JWT token is missing', 401);
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;

    req.user = {
      id: decoded.id,
      role: decoded.role,
      unitId: decoded.unitId,
    };

    return next();
  } catch {
    throw new AppError('Invalid JWT token', 401);
  }
}

export function ensureRole(allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError('Insufficient permissions for this resource', 403);
    }

    return next();
  };
}
