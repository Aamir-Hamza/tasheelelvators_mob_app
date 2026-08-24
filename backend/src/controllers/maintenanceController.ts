import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as maintenanceService from '../services/maintenanceService';
import { MaintenanceStatus } from '../models/MaintenanceJob';

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await maintenanceService.listJobs(req.user!, {
      status: req.query.status as MaintenanceStatus | undefined,
      date: req.query.date as string | undefined,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function stats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await maintenanceService.complianceStats(req.user!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await maintenanceService.getJob(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await maintenanceService.createJob(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function start(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await maintenanceService.startJob(req.params.id, req.user!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function checklist(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await maintenanceService.updateChecklist(req.params.id, req.body.checklist, req.user!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function signOff(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await maintenanceService.signOff(req.params.id, req.body.signedOffBy, req.body.notes, req.user!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
