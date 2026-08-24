import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export function KPIStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  const { theme } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.value, { color: color || theme.text }]}>{value}</Text>
      <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '47%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  value: { fontSize: 26, fontWeight: '800' },
  label: { marginTop: 4, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
});
