import { FaultTicket, FaultPriority, FaultStatus } from '../models/FaultTicket';
import { Elevator } from '../models/Elevator';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { nextPrefixedId } from '../utils/ids';
import { IUser } from '../models/User';

const populate = [
  { path: 'elevatorId', select: 'liftId customerName building location status' },
  { path: 'assignedTechId', select: 'name phone email' },
  { path: 'reportedBy', select: 'name role company' },
];

function scopedQuery(user: IUser) {
  if (user.role === 'technician') {
    return { assignedTechId: user._id };
  }
  return {};
}

export async function listFaults(user: IUser, filters: { priority?: FaultPriority; status?: FaultStatus }) {
  const query: Record<string, unknown> = { ...scopedQuery(user) };
  if (filters.priority) query.priority = filters.priority;
  if (filters.status) query.status = filters.status;

  if (user.role === 'customer') {
    const elevators = await Elevator.find({ customerName: user.company || user.name }).select('_id');
    query.elevatorId = { $in: elevators.map((e) => e._id) };
  }

  return FaultTicket.find(query).populate(populate).sort({ reportedAt: -1 });
}

export async function getFault(id: string) {
  const ticket = await FaultTicket.findById(id).populate(populate);
  if (!ticket) throw new AppError('Fault ticket not found', 404);
  return ticket;
}

export async function createFault(
  user: IUser,
  input: {
    elevatorId: string;
    faultType: string;
    priority?: FaultPriority;
    description: string;
    mediaUrl?: string;
  }
) {
  const elevator = await Elevator.findById(input.elevatorId);
  if (!elevator) throw new AppError('Elevator not found', 404);

  const ids = (await FaultTicket.find().select('ticketId')).map((t) => t.ticketId);
  const ticket = await FaultTicket.create({
    ticketId: nextPrefixedId('FT-', ids, 4),
    elevatorId: elevator._id,
    faultType: input.faultType,
    priority: input.priority || 'Normal',
    description: input.description,
    mediaUrl: input.mediaUrl,
    reportedBy: user._id,
    status: 'Open',
  });

  if (input.priority === 'Critical' || elevator.status === 'operational') {
    elevator.status = input.priority === 'Critical' ? 'fault' : 'attention';
    elevator.healthScore = Math.min(elevator.healthScore, input.priority === 'Critical' ? 35 : 68);
    await elevator.save();
  }

  return ticket.populate(populate);
}

export async function assignFault(id: string, technicianId: string) {
  const tech = await User.findById(technicianId);
  if (!tech || tech.role !== 'technician') throw new AppError('Technician not found', 404);
  const ticket = await FaultTicket.findByIdAndUpdate(
    id,
    { assignedTechId: tech._id, status: 'Assigned' },
    { new: true }
  ).populate(populate);
  if (!ticket) throw new AppError('Fault ticket not found', 404);
  return ticket;
}

export async function updateFaultStatus(id: string, status: FaultStatus, user: IUser) {
  const ticket = await FaultTicket.findById(id);
  if (!ticket) throw new AppError('Fault ticket not found', 404);
  if (user.role === 'technician' && String(ticket.assignedTechId) !== String(user._id)) {
    throw new AppError('Not assigned to this ticket', 403);
  }
  ticket.status = status;
  if (status === 'In-Progress' && !ticket.assignedTechId) {
    ticket.assignedTechId = user._id;
  }
  await ticket.save();
  return ticket.populate(populate);
}
