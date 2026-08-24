import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { api } from '../services/api';
import { dropElevatorFromCache } from '../services/queryClient';
import { Elevator } from '../services/types';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../theme/ThemeContext';
import { RootStackParamList } from '../navigation/types';

function Tile({
  icon,
  label,
  value,
  warn,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  warn?: boolean;
}) {
  const { theme } = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <MaterialCommunityIcons name={icon} size={22} color={warn ? theme.alert : theme.accent} />
      <Text style={[styles.value, { color: warn ? theme.alert : theme.text }]}>{value}</Text>
      <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>
    </View>
  );
}

export function TelemetryScreen() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const route = useRoute<RouteProp<RootStackParamList, 'Telemetry'>>();

  const query = useQuery({
    queryKey: ['telemetry', route.params.id],
    queryFn: async () => {
      try {
        return (await api.get(`/elevators/${route.params.id}/telemetry`)).data.data as {
          liftId: string;
          building: string;
          iotStatus: string;
          telemetry: Elevator['telemetry'];
        };
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) dropElevatorFromCache(route.params.id);
        throw err;
      }
    },
    refetchInterval: 4000,
    retry: false,
  });

  if (!query.data) {
    return (
      <Screen scroll={false}>
        <ActivityIndicator color={theme.accent} />
      </Screen>
    );
  }

  const tel = query.data.telemetry;
  return (
    <Screen>
      <Text style={[styles.title, { color: theme.text }]}>{query.data.liftId}</Text>
      <Text style={{ color: theme.muted, marginBottom: 14 }}>
        {query.data.building} · IoT {query.data.iotStatus.toUpperCase()}
      </Text>
      <View style={styles.grid}>
        <Tile icon="play-pause" label={t('runStop')} value={tel.runState} warn={tel.runState === 'STOP'} />
        <Tile icon="door" label={t('doorStatus')} value={tel.doorStatus} />
        <Tile icon="thermometer" label={t('machineTemp')} value={`${tel.machineTempC}°C`} warn={tel.machineTempC > 55} />
        <Tile icon="layers-outline" label={t('floor')} value={tel.floor} />
        <Tile icon="signal-4g" label={t('signal4g')} value={`${tel.signal4g}%`} warn={tel.signal4g < 50} />
        <Tile icon="car-battery" label={t('ardBattery')} value={`${tel.ardBatteryPct}%`} warn={tel.ardBatteryPct < 50} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '48%', borderWidth: 1, borderRadius: 14, padding: 14, minHeight: 110 },
  value: { fontSize: 22, fontWeight: '800', marginTop: 10 },
  label: { fontSize: 12, fontWeight: '700', marginTop: 4 },
});
