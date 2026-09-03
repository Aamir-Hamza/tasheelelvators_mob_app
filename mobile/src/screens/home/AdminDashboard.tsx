import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Screen } from '../../components/Screen';
import { KPIStat } from '../../components/KPIStat';
import { HealthScoreCircle } from '../../components/HealthScoreCircle';
import { ElevatorCard } from '../../components/ElevatorCard';
import { useElevatorsQuery } from '../../services/useElevatorsQuery';
import { EmergencyBanner } from '../../components/EmergencyBanner';
import { NotificationFeed } from '../../components/NotificationFeed';
import { api } from '../../services/api';
import { dropElevatorFromCache, queryClient } from '../../services/queryClient';
import { EmergencyEvent, FaultTicket, FleetStats } from '../../services/types';
import { useI18n } from '../../context/I18nContext';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { RootStackParamList } from '../../navigation/types';
import { liftRef } from '../../utils/format';

export function AdminDashboard() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const stats = useQuery({
    queryKey: ['fleet-stats'],
    queryFn: async () => (await api.get('/elevators/stats')).data.data as FleetStats,
    refetchInterval: 3000,
  });
  const elevators = useElevatorsQuery();
  const emergency = useQuery({
    queryKey: ['emergency-active'],
    queryFn: async () => (await api.get('/emergencies/active')).data.data as EmergencyEvent | null,
    refetchInterval: 5000,
  });
  const faults = useQuery({
    queryKey: ['faults'],
    queryFn: async () => (await api.get('/faults')).data.data as FaultTicket[],
    refetchInterval: 4000,
  });

  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: ['elevators'] });
      void queryClient.invalidateQueries({ queryKey: ['fleet-stats'] });
    }, [])
  );

  if (stats.isLoading && !elevators.data) {
    return (
      <Screen scroll={false}>
        <ActivityIndicator color={theme.accent} />
      </Screen>
    );
  }

  const kpis = stats.data;
  const criticalFaults = (faults.data ?? []).filter((f) => f.priority === 'Critical' && f.status !== 'Closed');

  return (
    <Screen refreshing={elevators.isRefetching} onRefresh={() => elevators.refetch()}>
      <Text style={[styles.kicker, { color: theme.accent }]}>{t('appName')}</Text>
      <Text style={[styles.hello, { color: theme.text }]}>{user?.name}</Text>
      <Text style={[styles.role, { color: theme.muted }]}>{t('roleAdmin')}</Text>

      <NotificationFeed />

      {emergency.data ? (
        <EmergencyBanner
          emergency={emergency.data}
          onPress={() => navigation.navigate('Main', { screen: 'Emergency' })}
        />
      ) : null}

      <Text style={[styles.section, { color: theme.text }]}>{t('fleetKpis')}</Text>
      <View style={styles.grid}>
        <KPIStat label={t('total')} value={kpis?.total ?? 0} />
        <KPIStat label={t('operational')} value={kpis?.operational ?? 0} color={theme.success} />
        <KPIStat label={t('faults')} value={kpis?.faults ?? 0} color={theme.alert} />
        <KPIStat label={t('maintenanceDue')} value={kpis?.maintenanceDue ?? 0} color={theme.warning} />
      </View>

      <View style={[styles.healthCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <HealthScoreCircle score={kpis?.healthAvg ?? 0} label={t('healthScore')} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.section, { color: theme.text, marginTop: 0 }]}>{t('urgentAlerts')}</Text>
          {criticalFaults.length === 0 ? (
            <Text style={{ color: theme.muted }}>{t('noData')}</Text>
          ) : (
            criticalFaults.slice(0, 3).map((f) => (
              <Text key={f._id} style={{ color: theme.alert, fontWeight: '700', marginBottom: 6 }}>
                {f.ticketId} · {liftRef(f.elevatorId).liftId} · {f.faultType}
              </Text>
            ))
          )}
        </View>
      </View>

      <View style={styles.rowBetween}>
        <Text style={[styles.section, { color: theme.text }]}>{t('liveElevators')}</Text>
        <Pressable onPress={() => navigation.navigate('Main', { screen: 'Elevators' })}>
          <Text style={{ color: theme.accent, fontWeight: '700' }}>{t('registry')}</Text>
        </Pressable>
      </View>
      {(elevators.data ?? []).map((el) => (
        <ElevatorCard
          key={el._id}
          elevator={el}
          onPress={() => navigation.navigate('ElevatorDetail', { id: el._id })}
          onDelete={user?.role === 'admin' ? () => {
            dropElevatorFromCache(el._id);
            api.delete(`/elevators/${el._id}`).then(() => {
              void elevators.refetch();
              void queryClient.invalidateQueries({ queryKey: ['fleet-stats'] });
            }).catch(() => {
              dropElevatorFromCache(el._id);
              void elevators.refetch();
            });
          } : undefined}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { fontWeight: '900', letterSpacing: 2, fontSize: 12 },
  hello: { fontSize: 24, fontWeight: '800', marginTop: 4 },
  role: { marginBottom: 16 },
  section: { fontSize: 16, fontWeight: '800', marginTop: 8, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  healthCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
