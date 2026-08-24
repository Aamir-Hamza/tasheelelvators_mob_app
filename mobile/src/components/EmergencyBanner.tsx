import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EmergencyEvent } from '../services/types';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { formatCountdown, liftRef, slaMsRemaining, techRef } from '../utils/format';

export function EmergencyBanner({
  emergency,
  onPress,
  actionLabel,
  onAction,
}: {
  emergency: EmergencyEvent;
  onPress?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [remain, setRemain] = useState(() => slaMsRemaining(emergency.slaStartTime, emergency.slaMinutes));

  useEffect(() => {
    const id = setInterval(() => {
      setRemain(slaMsRemaining(emergency.slaStartTime, emergency.slaMinutes));
    }, 1000);
    return () => clearInterval(id);
  }, [emergency.slaStartTime, emergency.slaMinutes]);

  const breached = remain < 0;
  const lift = liftRef(emergency.elevatorId);
  const tech = techRef(emergency.assignedTechId);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: theme.alert, borderColor: '#7a160f' }]}
    >
      <View style={styles.top}>
        <View style={styles.live}>
          <MaterialCommunityIcons name="alarm-light" size={16} color="#fff" />
          <Text style={styles.liveText}>{t('activeEmergency')}</Text>
        </View>
        <Text style={styles.id}>{emergency.emergencyId}</Text>
      </View>
      <Text style={styles.title}>
        {lift.liftId ?? '—'} · {emergency.building} · {t('floor')} {emergency.floor}
      </Text>
      <Text style={styles.desc}>{emergency.description}</Text>
      <View style={styles.timerRow}>
        <View>
          <Text style={styles.timerLabel}>{breached ? t('slaBreached') : t('slaRemaining')}</Text>
          <Text style={styles.timer}>{formatCountdown(remain)}</Text>
        </View>
        {tech.name ? <Text style={styles.tech}>{tech.name}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.action}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 14, borderWidth: 1, marginBottom: 14 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  live: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveText: { color: '#fff', fontWeight: '800', fontSize: 11, letterSpacing: 0.8 },
  id: { color: '#ffd7d0', fontWeight: '700' },
  title: { color: '#fff', fontWeight: '800', marginTop: 8, fontSize: 16 },
  desc: { color: '#ffd7d0', marginTop: 4, fontSize: 13 },
  timerRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  timerLabel: { color: '#ffd7d0', fontSize: 11, fontWeight: '700' },
  timer: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 1 },
  tech: { color: '#fff', fontWeight: '700' },
  action: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionText: { color: '#b42318', fontWeight: '800' },
});
