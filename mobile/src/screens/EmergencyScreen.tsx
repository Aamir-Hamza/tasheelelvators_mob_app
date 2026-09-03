import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../components/Screen';
import { EmergencyBanner } from '../components/EmergencyBanner';
import { AssignTechModal } from '../components/AssignTechModal';
import { CreateFaultModal } from '../components/CreateFaultModal';
import { api } from '../services/api';
import { useElevatorsQuery } from '../services/useElevatorsQuery';
import { EmergencyEvent, FaultTicket, User } from '../services/types';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../theme/ThemeContext';
import { useToast } from '../context/ToastContext';
import { formatWhen, liftRef, techRef } from '../utils/format';

const PRIORITY_FILTERS = ['All', 'Critical', 'High', 'Normal'] as const;
const STATUS_CYCLE = ['Open', 'Assigned', 'In-Progress', 'Closed'] as const;

export function EmergencyScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { theme } = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const [assignFor, setAssignFor] = useState<{ kind: 'emergency' | 'fault'; id: string } | null>(null);
  const [priority, setPriority] = useState<(typeof PRIORITY_FILTERS)[number]>('All');
  const [faultOpen, setFaultOpen] = useState(false);

  const emergency = useQuery({
    queryKey: ['emergency-active'],
    queryFn: async () => (await api.get('/emergencies/active')).data.data as EmergencyEvent | null,
    refetchInterval: 4000,
  });
  const faults = useQuery({
    queryKey: ['faults', priority],
    queryFn: async () => {
      const q = priority === 'All' ? '' : `?priority=${priority}`;
      return (await api.get(`/faults${q}`)).data.data as FaultTicket[];
    },
  });
  const techs = useQuery({
    queryKey: ['technicians'],
    queryFn: async () => (await api.get('/auth/technicians')).data.data as User[],
    enabled: user?.role === 'admin',
  });
  const elevators = useElevatorsQuery({ paused: faultOpen });

  const assignEmergency = useMutation({
    mutationFn: (technicianId: string) => api.patch(`/emergencies/${assignFor?.id}/assign`, { technicianId }),
    onSuccess: () => {
      setAssignFor(null);
      qc.invalidateQueries({ queryKey: ['emergency-active'] });
      toast.show(t('dispatched'), 'success');
    },
  });
  const assignFault = useMutation({
    mutationFn: (technicianId: string) => api.patch(`/faults/${assignFor?.id}/assign`, { technicianId }),
    onSuccess: () => {
      setAssignFor(null);
      qc.invalidateQueries({ queryKey: ['faults'] });
      toast.show(t('dispatched'), 'success');
    },
  });
  const cycleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/faults/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faults'] });
      toast.show(t('saved'), 'success');
    },
  });
  const createFault = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post('/faults', payload),
    onSuccess: () => {
      setFaultOpen(false);
      qc.invalidateQueries({ queryKey: ['faults'] });
      toast.show(t('reportSubmitted'), 'success');
    },
  });

  const nextStatus = (status: FaultTicket['status']) => {
    const i = STATUS_CYCLE.indexOf(status);
    return STATUS_CYCLE[Math.min(i + 1, STATUS_CYCLE.length - 1)];
  };

  const statusLabel = (s: FaultTicket['status']) => {
    if (s === 'In-Progress') return t('diagnosis');
    if (s === 'Open') return t('open');
    if (s === 'Assigned') return t('assigned');
    return t('closed');
  };

  return (
    <View style={{ flex: 1 }}>
    <Screen>
      <Text style={[styles.title, { color: theme.text }]}>{t('emergencyCenter')}</Text>
      {emergency.data ? (
        <>
          <EmergencyBanner emergency={emergency.data} />
          {user?.role === 'admin' ? (
            <Pressable
              onPress={() => setAssignFor({ kind: 'emergency', id: emergency.data!._id })}
              style={[styles.cta, { backgroundColor: theme.accent }]}
            >
              <Text style={styles.ctaText}>{t('assignTech')}</Text>
            </Pressable>
          ) : null}
          <Text style={[styles.section, { color: theme.text }]}>{t('timeline')}</Text>
          {emergency.data.timeline.map((item, idx) => (
            <View key={`${item.event}-${idx}`} style={styles.tlRow}>
              <View style={[styles.dot, { backgroundColor: idx === 0 ? theme.alert : theme.accent }]} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: '800' }}>{item.event}</Text>
                <Text style={{ color: theme.muted, fontSize: 12 }}>{formatWhen(item.timestamp)}</Text>
                {item.note ? <Text style={{ color: theme.muted }}>{item.note}</Text> : null}
              </View>
            </View>
          ))}
        </>
      ) : (
        <Text style={{ color: theme.muted, marginBottom: 16 }}>{t('noActiveEmergency')}</Text>
      )}

      <View style={styles.rowBetween}>
        <Text style={[styles.section, { color: theme.text }]}>{t('tickets')}</Text>
        {user?.role !== 'technician' ? (
          <Pressable onPress={() => setFaultOpen(true)}>
            <Text style={{ color: theme.accent, fontWeight: '800' }}>{t('reportFault')}</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.chips}>
        {PRIORITY_FILTERS.map((p) => (
          <Pressable
            key={p}
            onPress={() => setPriority(p)}
            style={[
              styles.chip,
              {
                backgroundColor: priority === p ? theme.accent : theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={{ color: priority === p ? '#fff' : theme.text, fontWeight: '700', fontSize: 12 }}>
              {p === 'All' ? t('all') : p}
            </Text>
          </Pressable>
        ))}
      </View>
      {(faults.data ?? []).map((f) => (
        <View key={f._id} style={[styles.ticket, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.rowBetween}>
            <Text style={{ color: theme.text, fontWeight: '800' }}>{f.ticketId}</Text>
            <Text
              style={{
                color: f.priority === 'Critical' ? theme.alert : f.priority === 'High' ? theme.warning : theme.success,
                fontWeight: '800',
              }}
            >
              {f.priority}
            </Text>
          </View>
          <Text style={{ color: theme.muted }}>
            {liftRef(f.elevatorId).liftId} · {f.faultType}
          </Text>
          <Text style={{ color: theme.text, marginTop: 4 }}>{f.description}</Text>
          <Text style={{ color: theme.muted, marginTop: 6, fontSize: 12 }}>
            {statusLabel(f.status)}
            {techRef(f.assignedTechId).name ? ` · ${techRef(f.assignedTechId).name}` : ''}
          </Text>
          <View style={styles.actions}>
            {user?.role === 'admin' && f.status === 'Open' ? (
              <Pressable onPress={() => setAssignFor({ kind: 'fault', id: f._id })}>
                <Text style={{ color: theme.accent, fontWeight: '800' }}>{t('assign')}</Text>
              </Pressable>
            ) : null}
            {user?.role !== 'customer' && f.status !== 'Closed' ? (
              <Pressable onPress={() => cycleStatus.mutate({ id: f._id, status: nextStatus(f.status) })}>
                <Text style={{ color: theme.accent, fontWeight: '800' }}>
                  {t('status')} → {statusLabel(nextStatus(f.status))}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ))}

      <AssignTechModal
        visible={Boolean(assignFor)}
        technicians={techs.data ?? []}
        onClose={() => setAssignFor(null)}
        onSelect={(id) => {
          if (assignFor?.kind === 'emergency') assignEmergency.mutate(id);
          else assignFault.mutate(id);
        }}
      />
    </Screen>
      <CreateFaultModal
        visible={faultOpen}
        onClose={() => setFaultOpen(false)}
        elevators={elevators.data ?? []}
        onSubmit={(payload) => createFault.mutate(payload)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  cta: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 16 },
  ctaText: { color: '#fff', fontWeight: '800' },
  section: { fontSize: 16, fontWeight: '800', marginVertical: 10 },
  tlRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  ticket: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 8 },
});
