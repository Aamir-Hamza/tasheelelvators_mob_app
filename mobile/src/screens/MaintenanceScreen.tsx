import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { KPIStat } from '../components/KPIStat';
import { api } from '../services/api';
import { ComplianceStats, MaintenanceJob } from '../services/types';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../theme/ThemeContext';
import { RootStackParamList } from '../navigation/types';
import { liftRef, techRef } from '../utils/format';

export function MaintenanceScreen() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const stats = useQuery({
    queryKey: ['pm-stats'],
    queryFn: async () => (await api.get('/maintenance/stats')).data.data as ComplianceStats,
  });
  const jobs = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => (await api.get('/maintenance')).data.data as MaintenanceJob[],
  });

  const s = stats.data;

  return (
    <Screen>
      <Text style={[styles.title, { color: theme.text }]}>{t('pmSchedule')}</Text>
      <View style={styles.grid}>
        <KPIStat label={t('compliance')} value={`${s?.complianceRate ?? 0}%`} color={theme.success} />
        <KPIStat label={t('overdue')} value={s?.overdue ?? 0} color={theme.alert} />
        <KPIStat label={t('scheduled')} value={s?.scheduled ?? 0} color={theme.warning} />
        <KPIStat label={t('completed')} value={s?.completed ?? 0} />
      </View>
      {(jobs.data ?? []).map((job) => (
        <Pressable
          key={job._id}
          onPress={() => navigation.navigate('Checklist', { id: job._id })}
          style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <View style={styles.row}>
            <Text style={{ color: theme.text, fontWeight: '800' }}>{job.jobId}</Text>
            <Text
              style={{
                color:
                  job.status === 'overdue'
                    ? theme.alert
                    : job.status === 'completed'
                      ? theme.success
                      : theme.warning,
                fontWeight: '800',
              }}
            >
              {job.status.toUpperCase()}
            </Text>
          </View>
          <Text style={{ color: theme.muted }}>
            {liftRef(job.elevatorId).liftId} · {liftRef(job.elevatorId).building}
          </Text>
          <Text style={{ color: theme.muted, marginTop: 4 }}>
            {new Date(job.scheduledDate).toLocaleString()}
            {techRef(job.technicianId).name ? ` · ${techRef(job.technicianId).name}` : ''}
          </Text>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  card: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});
