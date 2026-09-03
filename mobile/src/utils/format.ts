import { ElevatorStatus } from '../services/types';

export function statusBadge(status: ElevatorStatus) {
  switch (status) {
    case 'fault':
      return { key: 'critical' as const, color: '#b42318' };
    case 'attention':
      return { key: 'attention' as const, color: '#f79009' };
    case 'offline':
      return { key: 'offline' as const, color: '#8b949e' };
    default:
      return { key: 'normal' as const, color: '#12b76a' };
  }
}

export function healthColor(score: number) {
  if (score >= 80) return '#12b76a';
  if (score >= 60) return '#f79009';
  return '#b42318';
}

export function slaMsRemaining(startIso: string, minutes: number) {
  return new Date(startIso).getTime() + minutes * 60_000 - Date.now();
}

export function formatCountdown(ms: number) {
  const abs = Math.abs(ms);
  const totalSec = Math.floor(abs / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const body = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return ms < 0 ? `+${body}` : body;
}

export function formatWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

export function matchesElevatorSearch(
  elevator: { liftId?: string; building?: string; location?: string; customerName?: string },
  q: string
) {
  const term = q.trim().toLowerCase();
  if (!term) return true;
  const hay = [elevator.liftId, elevator.building, elevator.location, elevator.customerName]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(term);
}

export function liftRef(value: unknown): { liftId?: string; building?: string; _id?: string } {
  if (value && typeof value === 'object') return value as { liftId?: string; building?: string; _id?: string };
  return {};
}

export function techRef(value: unknown): { name?: string; _id?: string; phone?: string } {
  if (value && typeof value === 'object') return value as { name?: string; _id?: string; phone?: string };
  return {};
}
