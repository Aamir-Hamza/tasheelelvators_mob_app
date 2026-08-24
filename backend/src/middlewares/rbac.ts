import { Response, NextFunction } from 'express';
import { UserRole } from '../models/User';
import { AuthRequest } from '../types';
import { AppError } from '../utils/AppError';

export function authorize(...roles: UserRole[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Forbidden for this role', 403));
    }
    next();
  };
}
