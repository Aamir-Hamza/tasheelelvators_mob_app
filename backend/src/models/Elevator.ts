import mongoose, { Document, Schema } from 'mongoose';

export type ElevatorStatus = 'operational' | 'fault' | 'attention' | 'offline';
export type ControllerType = 'Monarch' | 'Arkel' | 'STEP';
export type IotStatus = 'online' | 'degraded' | 'offline';
export type RunState = 'RUN' | 'STOP';
export type DoorStatus = 'OPEN' | 'CLOSED' | 'OPENING' | 'CLOSING';

export interface ITelemetry {
  runState: RunState;
  doorStatus: DoorStatus;
  machineTempC: number;
  floor: string;
  signal4g: number;
  ardBatteryPct: number;
  updatedAt: Date;
}

export interface IElevator extends Document {
  liftId: string;
  customerName: string;
  building: string;
  location: string;
  controllerType: ControllerType;
  capacity: number;
  speed: number;
  stops: number;
  iotStatus: IotStatus;
  healthScore: number;
  status: ElevatorStatus;
  telemetry: ITelemetry;
  createdAt: Date;
  updatedAt: Date;
}

const telemetrySchema = new Schema<ITelemetry>(
  {
    runState: { type: String, enum: ['RUN', 'STOP'], default: 'STOP' },
    doorStatus: { type: String, enum: ['OPEN', 'CLOSED', 'OPENING', 'CLOSING'], default: 'CLOSED' },
    machineTempC: { type: Number, default: 32 },
    floor: { type: String, default: 'G' },
    signal4g: { type: Number, min: 0, max: 100, default: 80 },
    ardBatteryPct: { type: Number, min: 0, max: 100, default: 95 },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const elevatorSchema = new Schema<IElevator>(
  {
    liftId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    customerName: { type: String, required: true, trim: true, index: true },
    building: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    controllerType: { type: String, enum: ['Monarch', 'Arkel', 'STEP'], required: true },
    capacity: { type: Number, required: true, min: 200 },
    speed: { type: Number, required: true, min: 0.1 },
    stops: { type: Number, required: true, min: 2 },
    iotStatus: { type: String, enum: ['online', 'degraded', 'offline'], default: 'online', index: true },
    healthScore: { type: Number, min: 0, max: 100, default: 100 },
    status: {
      type: String,
      enum: ['operational', 'fault', 'attention', 'offline'],
      default: 'operational',
      index: true,
    },
    telemetry: { type: telemetrySchema, default: () => ({}) },
  },
  { timestamps: true }
);

elevatorSchema.index({ status: 1, healthScore: 1 });

export const Elevator = mongoose.model<IElevator>('Elevator', elevatorSchema);
