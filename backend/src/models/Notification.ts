import mongoose, { Document, Schema, Types } from 'mongoose';

export type NotificationKind = 'fault' | 'emergency';

export interface INotification extends Document {
  userId: Types.ObjectId;
  title: string;
  body: string;
  kind: NotificationKind;
  elevatorId?: Types.ObjectId;
  ticketId?: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    kind: { type: String, enum: ['fault', 'emergency'], required: true },
    elevatorId: { type: Schema.Types.ObjectId, ref: 'Elevator' },
    ticketId: { type: String },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
