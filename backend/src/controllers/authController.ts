import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as authService from '../services/authService';
import { AppError } from '../utils/AppError';
import { UserRole } from '../models/User';

export async function login(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new AppError('Email and password required');
    const result = await authService.login(email, password);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function register(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, email, password, role, phone, company } = req.body as {
      name: string;
      email: string;
      password: string;
      role: UserRole;
      phone: string;
      company?: string;
    };
    if (!name || !email || !password || !role || !phone) {
      throw new AppError('Missing required fields');
    }
    const result = await authService.register({ name, email, password, role, phone, company });
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function me(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMe(String(req.user!._id));
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

export async function technicians(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const users = await authService.listTechnicians();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
}

export async function users(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await authService.listUsers();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
