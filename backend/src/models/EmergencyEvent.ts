import mongoose, { Document, Schema, Types } from 'mongoose';

export type EmergencyStatus = 'active' | 'assigned' | 'on-site' | 'resolved';

export interface ITimelineItem {
  event: string;
  timestamp: Date;
  note?: string;
}

export interface IEmergencyEvent extends Document {
  emergencyId: string;
  elevatorId: Types.ObjectId;
  building: string;
  floor: string;
  description: string;
  status: EmergencyStatus;
  slaStartTime: Date;
  slaMinutes: number;
  assignedTechId?: Types.ObjectId;
  timeline: ITimelineItem[];
  createdAt: Date;
  updatedAt: Date;
}

const timelineSchema = new Schema<ITimelineItem>(
  {
    event: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String },
  },
  { _id: false }
);

const emergencySchema = new Schema<IEmergencyEvent>(
  {
    emergencyId: { type: String, required: true, unique: true },
    elevatorId: { type: Schema.Types.ObjectId, ref: 'Elevator', required: true, index: true },
    building: { type: String, required: true },
    floor: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['active', 'assigned', 'on-site', 'resolved'],
      default: 'active',
      index: true,
    },
    slaStartTime: { type: Date, default: Date.now },
    slaMinutes: { type: Number, default: 15 },
    assignedTechId: { type: Schema.Types.ObjectId, ref: 'User' },
    timeline: { type: [timelineSchema], default: [] },
  },
  { timestamps: true }
);

emergencySchema.index({ status: 1, slaStartTime: -1 });

export const EmergencyEvent = mongoose.model<IEmergencyEvent>('EmergencyEvent', emergencySchema);
