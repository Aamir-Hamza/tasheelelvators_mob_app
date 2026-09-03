import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError('Route not found', 404));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const tooLarge =
    err &&
    typeof err === 'object' &&
    'type' in err &&
    (err as { type?: string }).type === 'entity.too.large';
  if (tooLarge) {
    res.status(413).json({
      success: false,
      message: 'Photo is too large. Use a smaller image or submit without a photo.',
    });
    return;
  }
  const mongoCode = err && typeof err === 'object' && 'code' in err ? Number((err as { code: unknown }).code) : 0;
  if (mongoCode === 11000) {
    res.status(409).json({ success: false, message: 'Email already registered' });
    return;
  }
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
