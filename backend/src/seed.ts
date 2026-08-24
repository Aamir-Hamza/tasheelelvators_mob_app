import bcrypt from 'bcryptjs';
import { connectDb } from './config/db';
import { User } from './models/User';
import { Elevator } from './models/Elevator';
import { FaultTicket } from './models/FaultTicket';
import { EmergencyEvent } from './models/EmergencyEvent';
import { MaintenanceJob } from './models/MaintenanceJob';
import { DEFAULT_CHECKLIST } from './services/maintenanceService';

async function seed() {
  await connectDb();
  await Promise.all([
    User.deleteMany({}),
    Elevator.deleteMany({}),
    FaultTicket.deleteMany({}),
    EmergencyEvent.deleteMany({}),
    MaintenanceJob.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash('Demo123!', 10);

  const [admin, oneic, abc, ahmed, salim] = await User.create([
    {
      name: 'Dispatcher Admin',
      email: 'admin@tasheel.om',
      passwordHash,
      role: 'admin',
      phone: '+968 9000 1001',
      company: 'Tasheel Elevators',
    },
    {
      name: 'Fatima Al-Harthy',
      email: 'fatima@oneic.om',
      passwordHash,
      role: 'customer',
      phone: '+968 9000 2002',
      company: 'ONEIC',
    },
    {
      name: 'Omar Rashid',
      email: 'ops@abctower.om',
      passwordHash,
      role: 'customer',
      phone: '+968 9000 2003',
      company: 'ABC Tower',
    },
    {
      name: 'Ahmed K.',
      email: 'ahmed.k@tasheel.om',
      passwordHash,
      role: 'technician',
      phone: '+968 9000 3001',
      company: 'Tasheel Elevators',
    },
    {
      name: 'Salim A.',
      email: 'salim.a@tasheel.om',
      passwordHash,
      role: 'technician',
      phone: '+968 9000 3002',
      company: 'Tasheel Elevators',
    },
  ]);

  const [el001, el002, el018, el007, el011, el021] = await Elevator.create([
    {
      liftId: 'EL-001',
      customerName: 'ABC Tower',
      building: 'ABC Tower',
      location: 'Al Khuwair, Muscat',
      controllerType: 'Monarch',
      capacity: 1000,
      speed: 1.75,
      stops: 16,
      iotStatus: 'online',
      healthScore: 94,
      status: 'operational',
      telemetry: {
        runState: 'RUN',
        doorStatus: 'CLOSED',
        machineTempC: 38,
        floor: '12',
        signal4g: 86,
        ardBatteryPct: 97,
        updatedAt: new Date(),
      },
    },
    {
      liftId: 'EL-002',
      customerName: 'ONEIC',
      building: 'ONEIC HQ',
      location: 'Ruwi, Muscat',
      controllerType: 'Arkel',
      capacity: 800,
      speed: 1.6,
      stops: 8,
      iotStatus: 'online',
      healthScore: 71,
      status: 'attention',
      telemetry: {
        runState: 'RUN',
        doorStatus: 'OPENING',
        machineTempC: 46,
        floor: '3',
        signal4g: 72,
        ardBatteryPct: 81,
        updatedAt: new Date(),
      },
    },
    {
      liftId: 'EL-018',
      customerName: 'City Centre Qurum',
      building: 'City Centre Mall',
      location: 'Qurum, Muscat',
      controllerType: 'STEP',
      capacity: 1275,
      speed: 1.0,
      stops: 6,
      iotStatus: 'online',
      healthScore: 34,
      status: 'fault',
      telemetry: {
        runState: 'STOP',
        doorStatus: 'CLOSED',
        machineTempC: 62,
        floor: '4',
        signal4g: 54,
        ardBatteryPct: 41,
        updatedAt: new Date(),
      },
    },
    {
      liftId: 'EL-007',
      customerName: 'ONEIC',
      building: 'Muscat Grand Mall',
      location: 'Al Khuwair, Muscat',
      controllerType: 'Arkel',
      capacity: 1000,
      speed: 1.6,
      stops: 12,
      iotStatus: 'online',
      healthScore: 88,
      status: 'operational',
      telemetry: {
        runState: 'RUN',
        doorStatus: 'CLOSED',
        machineTempC: 35,
        floor: 'G',
        signal4g: 91,
        ardBatteryPct: 94,
        updatedAt: new Date(),
      },
    },
    {
      liftId: 'EL-011',
      customerName: 'ABC Tower',
      building: 'Ministry Complex',
      location: 'Al Ghubra, Muscat',
      controllerType: 'Monarch',
      capacity: 630,
      speed: 1.0,
      stops: 10,
      iotStatus: 'degraded',
      healthScore: 65,
      status: 'attention',
      telemetry: {
        runState: 'STOP',
        doorStatus: 'OPEN',
        machineTempC: 44,
        floor: 'L1',
        signal4g: 48,
        ardBatteryPct: 76,
        updatedAt: new Date(),
      },
    },
    {
      liftId: 'EL-021',
      customerName: 'ABC Tower',
      building: 'Residential Tower B',
      location: 'Azaiba, Muscat',
      controllerType: 'STEP',
      capacity: 1000,
      speed: 1.75,
      stops: 20,
      iotStatus: 'offline',
      healthScore: 0,
      status: 'offline',
      telemetry: {
        runState: 'STOP',
        doorStatus: 'CLOSED',
        machineTempC: 0,
        floor: '--',
        signal4g: 0,
        ardBatteryPct: 12,
        updatedAt: new Date(Date.now() - 1000 * 60 * 90),
      },
    },
  ]);

  const slaStart = new Date(Date.now() - 1000 * 60 * 6);

  await EmergencyEvent.create({
    emergencyId: 'EM-2408',
    elevatorId: el018._id,
    building: el018.building,
    floor: '4',
    description: 'Passengers trapped — door lock fault, car stopped between L4 and L5',
    status: 'active',
    slaStartTime: slaStart,
    slaMinutes: 15,
    timeline: [
      { event: 'SOS received', timestamp: slaStart, note: 'Mall security panic call + car alarm' },
      {
        event: 'Dispatcher notified',
        timestamp: new Date(slaStart.getTime() + 40_000),
        note: 'Fleet command alert EL-018 CRITICAL',
      },
      {
        event: 'Controller telemetry lock',
        timestamp: new Date(slaStart.getTime() + 90_000),
        note: 'STEP AS380 reports door zone fault DZ-04',
      },
    ],
  });

  await FaultTicket.create([
    {
      ticketId: 'FT-1001',
      elevatorId: el018._id,
      faultType: 'Door lock failure',
      priority: 'Critical',
      description: 'Landing door lock circuit open on floor 4. Car cannot leave door zone.',
      assignedTechId: ahmed._id,
      status: 'Assigned',
      reportedAt: slaStart,
      reportedBy: admin._id,
    },
    {
      ticketId: 'FT-1002',
      elevatorId: el002._id,
      faultType: 'Unusual motor noise',
      priority: 'High',
      description: 'High-frequency vibration during up travel from L2 to L5. Suspect brake lining.',
      assignedTechId: salim._id,
      status: 'In-Progress',
      reportedAt: new Date(Date.now() - 1000 * 60 * 180),
      reportedBy: oneic._id,
    },
    {
      ticketId: 'FT-1003',
      elevatorId: el011._id,
      faultType: 'Landing indicator',
      priority: 'Normal',
      description: 'Hall lantern on L1 stuck on. Cosmetic, unit still in service.',
      status: 'Open',
      reportedAt: new Date(Date.now() - 1000 * 60 * 50),
      reportedBy: abc._id,
    },
  ]);

  const today = new Date();
  today.setHours(9, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const jobs = await MaintenanceJob.create([
    {
      jobId: 'MJ-0001',
      elevatorId: el001._id,
      technicianId: ahmed._id,
      scheduledDate: today,
      checklist: DEFAULT_CHECKLIST,
      status: 'scheduled',
    },
    {
      jobId: 'MJ-0002',
      elevatorId: el007._id,
      technicianId: salim._id,
      scheduledDate: yesterday,
      checklist: DEFAULT_CHECKLIST,
      status: 'overdue',
    },
    {
      jobId: 'MJ-0003',
      elevatorId: el002._id,
      technicianId: salim._id,
      scheduledDate: today,
      checklist: DEFAULT_CHECKLIST.map((c, i) => ({ ...c, completed: i < 2 })),
      status: 'in-progress',
    },
    {
      jobId: 'MJ-0004',
      elevatorId: el011._id,
      technicianId: ahmed._id,
      scheduledDate: tomorrow,
      checklist: DEFAULT_CHECKLIST,
      status: 'scheduled',
    },
  ]);

  ahmed.activeJobs = [jobs[0]._id];
  salim.activeJobs = [jobs[1]._id, jobs[2]._id];
  await ahmed.save();
  await salim.save();

  console.log('Seed complete. Demo logins (password: Demo123!):');
  console.log('  Admin      admin@tasheel.om');
  console.log('  Customer   fatima@oneic.om   (ONEIC)');
  console.log('  Customer   ops@abctower.om   (ABC Tower)');
  console.log('  Tech       ahmed.k@tasheel.om  (Ahmed K.)');
  console.log('  Tech       salim.a@tasheel.om  (Salim A.)');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
