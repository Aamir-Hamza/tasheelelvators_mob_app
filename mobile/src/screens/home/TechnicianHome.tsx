import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { EmergencyBanner } from '../../components/EmergencyBanner';
import { api } from '../../services/api';
import { EmergencyEvent, FaultTicket, MaintenanceJob } from '../../services/types';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useTheme } from '../../theme/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { RootStackParamList } from '../../navigation/types';
import { liftRef } from '../../utils/format';

export function TechnicianHome() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { theme } = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const emergency = useQuery({
    queryKey: ['emergency-active'],
    queryFn: async () => (await api.get('/emergencies/active')).data.data as EmergencyEvent | null,
    refetchInterval: 4000,
  });
  const jobs = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => (await api.get('/maintenance')).data.data as MaintenanceJob[],
  });
  const faults = useQuery({
    queryKey: ['faults'],
    queryFn: async () => (await api.get('/faults')).data.data as FaultTicket[],
  });

  const startEmergency = useMutation({
    mutationFn: (id: string) => api.patch(`/emergencies/${id}/status`, { status: 'on-site', note: 'Technician started job' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emergency-active'] });
      toast.show(t('jobStarted'), 'success');
    },
  });

  const startJob = useMutation({
    mutationFn: (id: string) => api.patch(`/maintenance/${id}/start`),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ['maintenance'] });
      toast.show(t('jobStarted'), 'success');
      navigation.navigate('Checklist', { id });
    },
  });

  const activeJobs = (jobs.data ?? []).filter((j) => j.status !== 'completed');

  return (
    <Screen>
      <Text style={[styles.kicker, { color: theme.accent }]}>{t('roleTechnician')}</Text>
      <Text style={[styles.hello, { color: theme.text }]}>{user?.name}</Text>
      <Text style={[styles.sub, { color: theme.muted }]}>{t('assignedToYou')}</Text>

      {emergency.data ? (
        <EmergencyBanner
          emergency={emergency.data}
          actionLabel={t('startJob')}
          onAction={() => startEmergency.mutate(emergency.data!._id)}
        />
      ) : null}

      <Text style={[styles.section, { color: theme.text }]}>{t('pmSchedule')}</Text>
      {activeJobs.map((job) => (
        <Pressable
          key={job._id}
          onPress={() => navigation.navigate('Checklist', { id: job._id })}
          style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <View style={styles.row}>
            <Text style={[styles.id, { color: theme.text }]}>{job.jobId}</Text>
            <Text style={{ color: job.status === 'overdue' ? theme.alert : theme.warning, fontWeight: '800' }}>
              {job.status.toUpperCase()}
            </Text>
          </View>
          <Text style={{ color: theme.muted }}>
            {liftRef(job.elevatorId).liftId} · {liftRef(job.elevatorId).building}
          </Text>
          {job.status !== 'in-progress' ? (
            <Pressable
              onPress={() => startJob.mutate(job._id)}
              style={[styles.start, { backgroundColor: theme.accent }]}
            >
              <Text style={styles.startText}>{t('startJob')}</Text>
            </Pressable>
          ) : (
            <Text style={{ color: theme.accent, marginTop: 8, fontWeight: '700' }}>{t('checklist')}</Text>
          )}
        </Pressable>
      ))}

      <Text style={[styles.section, { color: theme.text }]}>{t('tickets')}</Text>
      {(faults.data ?? []).map((f) => (
        <View key={f._id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={{ color: theme.text, fontWeight: '800' }}>
            {f.ticketId} · {f.priority}
          </Text>
          <Text style={{ color: theme.muted }}>
            {liftRef(f.elevatorId).liftId} · {f.faultType}
          </Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { fontWeight: '900', letterSpacing: 1 },
  hello: { fontSize: 24, fontWeight: '800' },
  sub: { marginBottom: 14 },
  section: { fontWeight: '800', fontSize: 16, marginVertical: 10 },
  card: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  id: { fontWeight: '800' },
  start: { marginTop: 10, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  startText: { color: '#fff', fontWeight: '800' },
});
