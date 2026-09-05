import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User, UserRole } from '../models/User';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

function signToken(id: string, role: UserRole) {
  return jwt.sign({ id, role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as SignOptions);
}

function publicUser(user: { _id: unknown; name: string; email: string; role: UserRole; phone: string; company?: string; activeJobs: unknown[] }) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    company: user.company,
    activeJobs: user.activeJobs,
  };
}

export async function login(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) throw new AppError('Invalid credentials', 401);
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new AppError('Invalid credentials', 401);
  return { token: signToken(String(user._id), user.role), user: publicUser(user) };
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string;
  company?: string;
}) {
  const exists = await User.findOne({ email: input.email.toLowerCase().trim() });
  if (exists) throw new AppError('Email already registered', 409);
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase().trim(),
    passwordHash,
    role: input.role,
    phone: input.phone,
    company: input.company,
  });
  return { token: signToken(String(user._id), user.role), user: publicUser(user) };
}

export async function getMe(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  return publicUser(user);
}

export async function listTechnicians() {
  const techs = await User.find({ role: 'technician' }).select('name email phone activeJobs company');
  return techs.map(publicUser);
}

export async function listUsers() {
  const users = await User.find().select('name email phone role company activeJobs');
  return users.map(publicUser);
}

export async function savePushToken(
  userId: string,
  input: { token: string; platform?: string; type?: string }
) {
  const token = String(input.token || '').trim();
  if (!token) throw new AppError('Push token required');
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  user.pushTokens = [
    {
      token,
      platform: input.platform,
      type: input.type,
      updatedAt: new Date(),
    },
  ];
  await user.save();
  return { saved: true };
}
