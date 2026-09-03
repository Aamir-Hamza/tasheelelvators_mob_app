import mongoose, { Document, Schema, Types } from 'mongoose';

export type UserRole = 'admin' | 'customer' | 'technician';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone: string;
  company?: string;
  activeJobs: Types.ObjectId[];
  pushTokens: {
    token: string;
    platform?: string;
    type?: string;
    updatedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'customer', 'technician'], required: true, index: true },
    phone: { type: String, required: true, trim: true },
    company: { type: String, trim: true },
    activeJobs: [{ type: Schema.Types.ObjectId, ref: 'MaintenanceJob' }],
    pushTokens: {
      type: [
        {
          token: { type: String, required: true, trim: true },
          platform: { type: String, trim: true },
          type: { type: String, trim: true },
          updatedAt: { type: Date, default: Date.now },
          _id: false,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, name: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
