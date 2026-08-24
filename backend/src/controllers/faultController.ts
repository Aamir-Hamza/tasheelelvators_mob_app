import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as faultService from '../services/faultService';
import { FaultPriority, FaultStatus } from '../models/FaultTicket';

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await faultService.listFaults(req.user!, {
      priority: req.query.priority as FaultPriority | undefined,
      status: req.query.status as FaultStatus | undefined,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await faultService.getFault(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await faultService.createFault(req.user!, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function assign(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await faultService.assignFault(req.params.id, req.body.technicianId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await faultService.updateFaultStatus(req.params.id, req.body.status, req.user!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
