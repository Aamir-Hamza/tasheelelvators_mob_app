import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as elevatorService from '../services/elevatorService';

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await elevatorService.listElevators(req.user!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function stats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await elevatorService.fleetStats(req.user!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await elevatorService.getElevator(req.params.id, req.user!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await elevatorService.createElevator(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await elevatorService.updateElevator(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await elevatorService.deleteElevator(req.params.id);
    res.json({ success: true, message: 'Elevator deleted' });
  } catch (err) {
    next(err);
  }
}

export async function telemetry(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await elevatorService.getTelemetry(req.params.id, req.user!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function patchTelemetry(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await elevatorService.updateTelemetry(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
