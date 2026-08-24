import { Elevator, ElevatorStatus, ITelemetry } from '../models/Elevator';
import { MaintenanceJob } from '../models/MaintenanceJob';
import { FaultTicket } from '../models/FaultTicket';
import { EmergencyEvent } from '../models/EmergencyEvent';
import { User, IUser } from '../models/User';
import { AppError } from '../utils/AppError';
import { nextPrefixedId } from '../utils/ids';

function customerFilter(user: IUser) {
  if (user.role !== 'customer') return {};
  const company = user.company || user.name;
  return { customerName: company };
}

function isObjectId(id: string) {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

async function findElevatorDoc(id: string) {
  if (isObjectId(id)) {
    const byId = await Elevator.findById(id);
    if (byId) return byId;
  }
  return Elevator.findOne({ liftId: String(id).toUpperCase() });
}

export async function listElevators(user: IUser) {
  return Elevator.find(customerFilter(user)).sort({ liftId: 1 }).lean().read('primary');
}

export async function getElevator(id: string, user: IUser) {
  const elevator = await findElevatorDoc(id);
  if (!elevator) throw new AppError('Elevator not found', 404);
  if (user.role === 'customer') {
    const company = user.company || user.name;
    if (elevator.customerName !== company) throw new AppError('Forbidden', 403);
  }
  return elevator;
}

export async function createElevator(payload: Record<string, unknown>) {
  if (!payload.liftId) {
    const ids = (await Elevator.find().select('liftId')).map((e) => e.liftId);
    payload.liftId = nextPrefixedId('EL-', ids);
  }
  const exists = await Elevator.findOne({ liftId: String(payload.liftId).toUpperCase() });
  if (exists) throw new AppError('Lift ID already exists', 409);
  return Elevator.create(payload);
}

export async function updateElevator(id: string, payload: Record<string, unknown>) {
  const current = await findElevatorDoc(id);
  if (!current) throw new AppError('Elevator not found', 404);
  const elevator = await Elevator.findByIdAndUpdate(current._id, payload, { new: true, runValidators: true });
  if (!elevator) throw new AppError('Elevator not found', 404);
  return elevator;
}

export async function deleteElevator(id: string) {
  const elevator = await findElevatorDoc(id);
  if (!elevator) throw new AppError('Elevator not found', 404);

  const jobs = await MaintenanceJob.find({ elevatorId: elevator._id }).select('_id technicianId');
  const jobIds = jobs.map((j) => j._id);
  await Promise.all([
    FaultTicket.deleteMany({ elevatorId: elevator._id }),
    EmergencyEvent.deleteMany({ elevatorId: elevator._id }),
    MaintenanceJob.deleteMany({ elevatorId: elevator._id }),
    jobIds.length
      ? User.updateMany({ activeJobs: { $in: jobIds } }, { $pull: { activeJobs: { $in: jobIds } } })
      : Promise.resolve(),
  ]);
  await Elevator.deleteOne({ _id: elevator._id });
  return elevator;
}

export async function fleetStats(user: IUser) {
  const filter = customerFilter(user);
  const elevators = await Elevator.find(filter);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const elevatorIds = elevators.map((e) => e._id);
  const dueToday = await MaintenanceJob.countDocuments({
    elevatorId: { $in: elevatorIds },
    status: { $in: ['scheduled', 'overdue', 'in-progress'] },
    scheduledDate: { $lte: endOfDay },
  });

  const healthAvg =
    elevators.length === 0
      ? 0
      : Math.round(elevators.reduce((sum, e) => sum + e.healthScore, 0) / elevators.length);

  return {
    total: elevators.length,
    operational: elevators.filter((e) => e.status === 'operational').length,
    faults: elevators.filter((e) => e.status === 'fault').length,
    attention: elevators.filter((e) => e.status === 'attention').length,
    offline: elevators.filter((e) => e.status === 'offline').length,
    maintenanceDue: dueToday,
    healthAvg,
  };
}

export async function updateTelemetry(id: string, telemetry: Partial<ITelemetry>) {
  const elevator = await Elevator.findByIdAndUpdate(
    id,
    { telemetry: { ...telemetry, updatedAt: new Date() } },
    { new: true, runValidators: true }
  );
  if (!elevator) throw new AppError('Elevator not found', 404);
  return elevator.telemetry;
}

export async function getTelemetry(id: string, user: IUser) {
  const elevator = await getElevator(id, user);
  return { liftId: elevator.liftId, building: elevator.building, iotStatus: elevator.iotStatus, telemetry: elevator.telemetry };
}

export function badgeForStatus(status: ElevatorStatus): 'CRITICAL' | 'ATTENTION' | 'NORMAL' | 'OFFLINE' {
  if (status === 'fault') return 'CRITICAL';
  if (status === 'attention') return 'ATTENTION';
  if (status === 'offline') return 'OFFLINE';
  return 'NORMAL';
}
