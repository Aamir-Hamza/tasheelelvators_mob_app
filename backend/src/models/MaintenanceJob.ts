import mongoose, { Document, Schema, Types } from 'mongoose';

export type MaintenanceStatus = 'scheduled' | 'in-progress' | 'completed' | 'overdue';

export interface IChecklistItem {
  task: string;
  completed: boolean;
}

export interface IMaintenanceJob extends Document {
  jobId: string;
  elevatorId: Types.ObjectId;
  technicianId?: Types.ObjectId;
  scheduledDate: Date;
  completedDate?: Date;
  checklist: IChecklistItem[];
  status: MaintenanceStatus;
  notes?: string;
  signedOffBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const checklistSchema = new Schema<IChecklistItem>(
  {
    task: { type: String, required: true },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const maintenanceSchema = new Schema<IMaintenanceJob>(
  {
    jobId: { type: String, required: true, unique: true },
    elevatorId: { type: Schema.Types.ObjectId, ref: 'Elevator', required: true, index: true },
    technicianId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    scheduledDate: { type: Date, required: true, index: true },
    completedDate: { type: Date },
    checklist: { type: [checklistSchema], default: [] },
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'overdue'],
      default: 'scheduled',
      index: true,
    },
    notes: { type: String },
    signedOffBy: { type: String },
  },
  { timestamps: true }
);

maintenanceSchema.index({ status: 1, scheduledDate: 1 });

export const MaintenanceJob = mongoose.model<IMaintenanceJob>('MaintenanceJob', maintenanceSchema);
