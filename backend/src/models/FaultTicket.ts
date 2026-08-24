import mongoose, { Document, Schema, Types } from 'mongoose';

export type FaultPriority = 'Normal' | 'High' | 'Critical';
export type FaultStatus = 'Open' | 'Assigned' | 'In-Progress' | 'Closed';

export interface IFaultTicket extends Document {
  ticketId: string;
  elevatorId: Types.ObjectId;
  faultType: string;
  priority: FaultPriority;
  description: string;
  mediaUrl?: string;
  assignedTechId?: Types.ObjectId;
  status: FaultStatus;
  reportedAt: Date;
  reportedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const faultTicketSchema = new Schema<IFaultTicket>(
  {
    ticketId: { type: String, required: true, unique: true },
    elevatorId: { type: Schema.Types.ObjectId, ref: 'Elevator', required: true, index: true },
    faultType: { type: String, required: true, trim: true },
    priority: { type: String, enum: ['Normal', 'High', 'Critical'], default: 'Normal', index: true },
    description: { type: String, required: true, trim: true },
    mediaUrl: { type: String },
    assignedTechId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['Open', 'Assigned', 'In-Progress', 'Closed'],
      default: 'Open',
      index: true,
    },
    reportedAt: { type: Date, default: Date.now },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

faultTicketSchema.index({ status: 1, priority: 1, reportedAt: -1 });

export const FaultTicket = mongoose.model<IFaultTicket>('FaultTicket', faultTicketSchema);
