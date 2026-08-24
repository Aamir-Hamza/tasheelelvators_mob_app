import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../context/I18nContext';
import { ElevatorStatus } from '../services/types';
import { statusBadge } from '../utils/format';

export function StatusBadge({ status }: { status: ElevatorStatus }) {
  const { t } = useI18n();
  const badge = statusBadge(status);
  return (
    <View style={[styles.badge, { backgroundColor: `${badge.color}22`, borderColor: badge.color }]}>
      <Text style={[styles.text, { color: badge.color }]}>{t(badge.key)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  text: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
});
