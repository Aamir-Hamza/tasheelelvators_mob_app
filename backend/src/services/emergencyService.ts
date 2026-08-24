import { EmergencyEvent, EmergencyStatus } from '../models/EmergencyEvent';
import { Elevator } from '../models/Elevator';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { nextPrefixedId } from '../utils/ids';
import { IUser } from '../models/User';

const populate = [
  { path: 'elevatorId', select: 'liftId customerName building location status healthScore' },
  { path: 'assignedTechId', select: 'name phone email' },
];

export async function listEmergencies(user: IUser) {
  const query: Record<string, unknown> = {};
  if (user.role === 'technician') query.assignedTechId = user._id;
  if (user.role === 'customer') {
    const elevators = await Elevator.find({ customerName: user.company || user.name }).select('_id');
    query.elevatorId = { $in: elevators.map((e) => e._id) };
  }
  return EmergencyEvent.find(query).populate(populate).sort({ slaStartTime: -1 });
}

export async function getActiveEmergency(user: IUser) {
  const query: Record<string, unknown> = { status: { $ne: 'resolved' } };
  if (user.role === 'technician') query.assignedTechId = user._id;
  if (user.role === 'customer') {
    const elevators = await Elevator.find({ customerName: user.company || user.name }).select('_id');
    query.elevatorId = { $in: elevators.map((e) => e._id) };
  }
  return EmergencyEvent.findOne(query).sort({ slaStartTime: -1 }).populate(populate);
}

export async function createEmergency(
  user: IUser,
  input: { elevatorId: string; floor: string; description: string }
) {
  const elevator = await Elevator.findById(input.elevatorId);
  if (!elevator) throw new AppError('Elevator not found', 404);
  if (user.role === 'customer' && elevator.customerName !== (user.company || user.name)) {
    throw new AppError('Forbidden', 403);
  }

  const ids = (await EmergencyEvent.find().select('emergencyId')).map((e) => e.emergencyId);
  const now = new Date();
  const emergency = await EmergencyEvent.create({
    emergencyId: nextPrefixedId('EM-', ids, 4),
    elevatorId: elevator._id,
    building: elevator.building,
    floor: input.floor,
    description: input.description,
    status: 'active',
    slaStartTime: now,
    slaMinutes: 15,
    timeline: [
      { event: 'SOS received', timestamp: now, note: `Triggered by ${user.name}` },
      { event: 'Dispatcher notified', timestamp: now, note: 'Fleet command alert pushed' },
    ],
  });

  elevator.status = 'fault';
  elevator.healthScore = Math.min(elevator.healthScore, 28);
  elevator.telemetry.runState = 'STOP';
  elevator.telemetry.doorStatus = 'CLOSED';
  elevator.telemetry.updatedAt = now;
  await elevator.save();

  return emergency.populate(populate);
}

export async function assignEmergency(id: string, technicianId: string) {
  const tech = await User.findById(technicianId);
  if (!tech || tech.role !== 'technician') throw new AppError('Technician not found', 404);
  const emergency = await EmergencyEvent.findById(id);
  if (!emergency) throw new AppError('Emergency not found', 404);

  emergency.assignedTechId = tech._id;
  emergency.status = 'assigned';
  emergency.timeline.push({
    event: 'Technician dispatched',
    timestamp: new Date(),
    note: `${tech.name} assigned`,
  });
  await emergency.save();
  return emergency.populate(populate);
}

export async function updateEmergencyStatus(id: string, status: EmergencyStatus, note: string | undefined, user: IUser) {
  const emergency = await EmergencyEvent.findById(id);
  if (!emergency) throw new AppError('Emergency not found', 404);

  const labels: Record<EmergencyStatus, string> = {
    active: 'Emergency active',
    assigned: 'Technician assigned',
    'on-site': 'Technician on site',
    resolved: 'Incident resolved',
  };

  emergency.status = status;
  emergency.timeline.push({
    event: labels[status],
    timestamp: new Date(),
    note: note || `${user.name} updated status`,
  });
  await emergency.save();
  return emergency.populate(populate);
}
