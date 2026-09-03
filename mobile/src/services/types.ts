export type Role = 'admin' | 'customer' | 'technician';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string;
  company?: string;
  activeJobs?: string[];
}

export type ElevatorStatus = 'operational' | 'fault' | 'attention' | 'offline';
export type ControllerType = 'Monarch' | 'Arkel' | 'STEP';

export interface Telemetry {
  runState: 'RUN' | 'STOP';
  doorStatus: 'OPEN' | 'CLOSED' | 'OPENING' | 'CLOSING';
  machineTempC: number;
  floor: string;
  signal4g: number;
  ardBatteryPct: number;
  updatedAt: string;
}

export interface Elevator {
  _id: string;
  liftId: string;
  customerName: string;
  building: string;
  location: string;
  controllerType: ControllerType;
  capacity: number;
  speed: number;
  stops: number;
  iotStatus: 'online' | 'degraded' | 'offline';
  healthScore: number;
  status: ElevatorStatus;
  telemetry: Telemetry;
}

export interface FleetStats {
  total: number;
  operational: number;
  faults: number;
  attention: number;
  offline: number;
  maintenanceDue: number;
  healthAvg: number;
}

export interface RefUser {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface RefElevator {
  _id: string;
  liftId: string;
  customerName: string;
  building: string;
  location: string;
  status?: ElevatorStatus;
  healthScore?: number;
}

export interface FaultTicket {
  _id: string;
  ticketId: string;
  elevatorId: RefElevator | string;
  faultType: string;
  priority: 'Normal' | 'High' | 'Critical';
  description: string;
  mediaUrl?: string;
  assignedTechId?: RefUser | string;
  status: 'Open' | 'Assigned' | 'In-Progress' | 'Closed';
  reportedAt: string;
}

export interface TimelineItem {
  event: string;
  timestamp: string;
  note?: string;
}

export interface EmergencyEvent {
  _id: string;
  emergencyId: string;
  elevatorId: RefElevator | string;
  building: string;
  floor: string;
  description: string;
  status: 'active' | 'assigned' | 'on-site' | 'resolved';
  slaStartTime: string;
  slaMinutes: number;
  assignedTechId?: RefUser | string;
  timeline: TimelineItem[];
}

export interface ChecklistItem {
  task: string;
  completed: boolean;
}

export interface MaintenanceJob {
  _id: string;
  jobId: string;
  elevatorId: RefElevator | string;
  technicianId?: RefUser | string;
  scheduledDate: string;
  completedDate?: string;
  checklist: ChecklistItem[];
  status: 'scheduled' | 'in-progress' | 'completed' | 'overdue';
  notes?: string;
  signedOffBy?: string;
}

export interface ComplianceStats {
  total: number;
  completed: number;
  overdue: number;
  scheduled: number;
  complianceRate: number;
}

export interface AppNotification {
  _id: string;
  title: string;
  body: string;
  kind: 'fault' | 'emergency';
  ticketId?: string;
  read: boolean;
  createdAt: string;
  elevatorId?: RefElevator | string;
}
