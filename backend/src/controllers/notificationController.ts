import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as notificationService from '../services/notificationService';

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await notificationService.listForUser(req.user!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function unread(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const count = await notificationService.unreadCount(req.user!);
    res.json({ success: true, count });
  } catch (err) {
    next(err);
  }
}

export async function readOne(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await notificationService.markRead(req.user!, req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function readAll(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const count = await notificationService.markAllRead(req.user!);
    res.json({ success: true, count });
  } catch (err) {
    next(err);
  }
}
