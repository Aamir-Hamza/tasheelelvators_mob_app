import { MaintenanceJob, MaintenanceStatus } from '../models/MaintenanceJob';
import { Elevator } from '../models/Elevator';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { nextPrefixedId } from '../utils/ids';
import { IUser } from '../models/User';

export const DEFAULT_CHECKLIST = [
  { task: 'Controller inspection', completed: false },
  { task: 'Motor / Brake', completed: false },
  { task: 'Door locks', completed: false },
  { task: 'Safety circuits', completed: false },
  { task: 'ARD (rescue device)', completed: false },
  { task: 'Pit inspection', completed: false },
  { task: 'Ride quality', completed: false },
];

const populate = [
  { path: 'elevatorId', select: 'liftId customerName building location status' },
  { path: 'technicianId', select: 'name phone email' },
];

async function markOverdue() {
  const now = new Date();
  await MaintenanceJob.updateMany(
    { status: 'scheduled', scheduledDate: { $lt: now } },
    { $set: { status: 'overdue' } }
  );
}

export async function listJobs(user: IUser, filters: { status?: MaintenanceStatus; date?: string }) {
  await markOverdue();
  const query: Record<string, unknown> = {};
  if (user.role === 'technician') query.technicianId = user._id;
  if (user.role === 'customer') {
    const elevators = await Elevator.find({ customerName: user.company || user.name }).select('_id');
    query.elevatorId = { $in: elevators.map((e) => e._id) };
  }
  if (filters.status) query.status = filters.status;
  if (filters.date) {
    const start = new Date(filters.date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(filters.date);
    end.setHours(23, 59, 59, 999);
    query.scheduledDate = { $gte: start, $lte: end };
  }
  return MaintenanceJob.find(query).populate(populate).sort({ scheduledDate: 1 });
}

export async function getJob(id: string) {
  const job = await MaintenanceJob.findById(id).populate(populate);
  if (!job) throw new AppError('Maintenance job not found', 404);
  return job;
}

export async function createJob(input: {
  elevatorId: string;
  technicianId?: string;
  scheduledDate: string;
  checklist?: { task: string; completed?: boolean }[];
}) {
  const elevator = await Elevator.findById(input.elevatorId);
  if (!elevator) throw new AppError('Elevator not found', 404);
  if (input.technicianId) {
    const tech = await User.findById(input.technicianId);
    if (!tech || tech.role !== 'technician') throw new AppError('Technician not found', 404);
  }
  const ids = (await MaintenanceJob.find().select('jobId')).map((j) => j.jobId);
  const scheduledDate = new Date(input.scheduledDate);
  const status: MaintenanceStatus = scheduledDate < new Date() ? 'overdue' : 'scheduled';
  const job = await MaintenanceJob.create({
    jobId: nextPrefixedId('MJ-', ids, 4),
    elevatorId: elevator._id,
    technicianId: input.technicianId,
    scheduledDate,
    checklist: input.checklist?.length
      ? input.checklist.map((c) => ({ task: c.task, completed: Boolean(c.completed) }))
      : DEFAULT_CHECKLIST,
    status,
  });
  if (input.technicianId) {
    await User.findByIdAndUpdate(input.technicianId, { $addToSet: { activeJobs: job._id } });
  }
  return job.populate(populate);
}

export async function startJob(id: string, user: IUser) {
  const job = await MaintenanceJob.findById(id);
  if (!job) throw new AppError('Maintenance job not found', 404);
  if (user.role === 'technician' && job.technicianId && String(job.technicianId) !== String(user._id)) {
    throw new AppError('Not assigned to this job', 403);
  }
  if (user.role === 'technician' && !job.technicianId) {
    job.technicianId = user._id;
    await User.findByIdAndUpdate(user._id, { $addToSet: { activeJobs: job._id } });
  }
  job.status = 'in-progress';
  await job.save();
  return job.populate(populate);
}

export async function updateChecklist(
  id: string,
  checklist: { task: string; completed: boolean }[],
  user: IUser
) {
  const job = await MaintenanceJob.findById(id);
  if (!job) throw new AppError('Maintenance job not found', 404);
  if (user.role === 'technician' && String(job.technicianId) !== String(user._id)) {
    throw new AppError('Not assigned to this job', 403);
  }
  job.checklist = checklist;
  await job.save();
  return job.populate(populate);
}

export async function signOff(id: string, signedOffBy: string, notes: string | undefined, user: IUser) {
  const job = await MaintenanceJob.findById(id);
  if (!job) throw new AppError('Maintenance job not found', 404);
  if (user.role === 'technician' && String(job.technicianId) !== String(user._id)) {
    throw new AppError('Not assigned to this job', 403);
  }
  const incomplete = job.checklist.some((c) => !c.completed);
  if (incomplete) throw new AppError('Complete all checklist items before sign-off', 400);
  job.status = 'completed';
  job.completedDate = new Date();
  job.signedOffBy = signedOffBy || user.name;
  job.notes = notes;
  await job.save();
  if (job.technicianId) {
    await User.findByIdAndUpdate(job.technicianId, { $pull: { activeJobs: job._id } });
  }
  return job.populate(populate);
}

export async function complianceStats(user: IUser) {
  await markOverdue();
  const query: Record<string, unknown> = {};
  if (user.role === 'technician') query.technicianId = user._id;
  if (user.role === 'customer') {
    const elevators = await Elevator.find({ customerName: user.company || user.name }).select('_id');
    query.elevatorId = { $in: elevators.map((e) => e._id) };
  }
  const jobs = await MaintenanceJob.find(query);
  const completed = jobs.filter((j) => j.status === 'completed').length;
  const overdue = jobs.filter((j) => j.status === 'overdue').length;
  const scheduled = jobs.filter((j) => j.status === 'scheduled' || j.status === 'in-progress').length;
  const rate = jobs.length === 0 ? 100 : Math.round((completed / jobs.length) * 100);
  return { total: jobs.length, completed, overdue, scheduled, complianceRate: rate };
}
