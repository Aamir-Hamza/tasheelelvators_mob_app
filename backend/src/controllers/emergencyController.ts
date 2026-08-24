import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as emergencyService from '../services/emergencyService';

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await emergencyService.listEmergencies(req.user!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function active(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await emergencyService.getActiveEmergency(req.user!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await emergencyService.createEmergency(req.user!, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function assign(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await emergencyService.assignEmergency(req.params.id, req.body.technicianId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await emergencyService.updateEmergencyStatus(
      req.params.id,
      req.body.status,
      req.body.note,
      req.user!
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
