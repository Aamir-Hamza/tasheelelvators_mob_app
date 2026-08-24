import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChecklistItem } from '../services/types';
import { useTheme } from '../theme/ThemeContext';

export function MaintenanceChecklist({
  items,
  onToggle,
  readOnly,
}: {
  items: ChecklistItem[];
  onToggle?: (index: number) => void;
  readOnly?: boolean;
}) {
  const { theme } = useTheme();
  const done = items.filter((i) => i.completed).length;

  return (
    <View>
      <Text style={[styles.progress, { color: theme.muted }]}>
        {done}/{items.length}
      </Text>
      {items.map((item, index) => (
        <Pressable
          key={`${item.task}-${index}`}
          disabled={readOnly}
          onPress={() => onToggle?.(index)}
          style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <Ionicons
            name={item.completed ? 'checkbox' : 'square-outline'}
            size={22}
            color={item.completed ? theme.success : theme.muted}
          />
          <Text
            style={[
              styles.task,
              { color: theme.text, textDecorationLine: item.completed ? 'line-through' : 'none' },
            ]}
          >
            {item.task}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  progress: { fontWeight: '700', marginBottom: 8, fontSize: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  task: { flex: 1, fontWeight: '600' },
});
