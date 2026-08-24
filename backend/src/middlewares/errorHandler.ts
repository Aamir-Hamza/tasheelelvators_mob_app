import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError('Route not found', 404));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const status = err instanceof AppError ? err.statusCode : 500;
  const message = err instanceof Error ? err.message : 'Server error';
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({
    success: false,
    message: status === 500 ? 'Internal server error' : message,
  });
}
