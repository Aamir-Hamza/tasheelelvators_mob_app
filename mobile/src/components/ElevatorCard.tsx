import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Elevator } from '../services/types';
import { StatusBadge } from './StatusBadge';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { healthColor } from '../utils/format';

export function ElevatorCard({
  elevator,
  onPress,
  onDelete,
}: {
  elevator: Elevator;
  onPress?: () => void;
  onDelete?: () => void;
}) {
  const { theme } = useTheme();
  const { t } = useI18n();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
    >
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: `${healthColor(elevator.healthScore)}22` }]}>
          <Ionicons name="business" size={18} color={healthColor(elevator.healthScore)} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.top}>
            <Text style={[styles.id, { color: theme.text }]}>{elevator.liftId}</Text>
            <StatusBadge status={elevator.status} />
          </View>
          <Text style={[styles.building, { color: theme.text }]}>{elevator.building}</Text>
          <Text style={[styles.meta, { color: theme.muted }]}>
            {elevator.location} · {elevator.controllerType} · {elevator.stops} {t('stops').toLowerCase()}
          </Text>
        </View>
        {onDelete ? (
          <Pressable
            hitSlop={10}
            onPress={() => {
              Alert.alert(t('delete'), elevator.liftId, [
                { text: t('cancel'), style: 'cancel' },
                { text: t('delete'), style: 'destructive', onPress: onDelete },
              ]);
            }}
            style={[styles.trash, { borderColor: theme.alert }]}
          >
            <Ionicons name="trash-outline" size={18} color={theme.alert} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.footer}>
        <Text style={[styles.footText, { color: healthColor(elevator.healthScore) }]}>
          {t('healthScore')} {elevator.healthScore}
        </Text>
        <Text style={[styles.footText, { color: theme.muted }]}>
          IoT {elevator.iotStatus.toUpperCase()}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  id: { fontWeight: '800', fontSize: 16, letterSpacing: 0.3, flex: 1 },
  building: { marginTop: 2, fontWeight: '600' },
  meta: { marginTop: 2, fontSize: 12 },
  trash: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  footText: { fontSize: 11, fontWeight: '700' },
});
