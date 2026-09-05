import { Notification, NotificationKind } from '../models/Notification';
import { User, UserRole, IUser } from '../models/User';
import { sendExpoPush } from './pushService';

export async function notifyRoles(
  roles: UserRole[],
  payload: {
    title: string;
    body: string;
    kind: NotificationKind;
    elevatorId?: unknown;
    ticketId?: string;
    excludeUserId?: unknown;
  }
) {
  const staffQuery: Record<string, unknown> = { role: { $in: roles } };
  if (payload.excludeUserId) staffQuery._id = { $ne: payload.excludeUserId };
  const staff = await User.find(staffQuery).select('_id pushTokens');
  if (!staff.length) return [];
  const docs = staff.map((u) => ({
    userId: u._id,
    title: payload.title,
    body: payload.body,
    kind: payload.kind,
    elevatorId: payload.elevatorId,
    ticketId: payload.ticketId,
    read: false,
  }));
  const created = await Notification.insertMany(docs);

  const tokens = staff.flatMap((u) => {
    const list = u.pushTokens || [];
    const latest = [...list].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0];
    return latest?.token ? [latest.token] : [];
  });
  try {
    const result = await sendExpoPush({
      tokens,
      title: payload.title,
      body: payload.body,
      data: {
        kind: payload.kind,
        ticketId: payload.ticketId || '',
      },
    });
    if (result.invalid.length) {
      await User.updateMany(
        { 'pushTokens.token': { $in: result.invalid } },
        { $pull: { pushTokens: { token: { $in: result.invalid } } } }
      );
    }
  } catch (err) {
    console.error('Push send failed', err);
  }

  return created;
}

export async function listForUser(user: IUser) {
  return Notification.find({ userId: user._id })
    .populate('elevatorId', 'liftId building location')
    .sort({ createdAt: -1 })
    .limit(50);
}

export async function unreadCount(user: IUser) {
  return Notification.countDocuments({ userId: user._id, read: false });
}

export async function markRead(user: IUser, id: string) {
  return Notification.findOneAndUpdate({ _id: id, userId: user._id }, { read: true }, { new: true });
}

export async function markAllRead(user: IUser) {
  await Notification.updateMany({ userId: user._id, read: false }, { read: true });
  return unreadCount(user);
}
