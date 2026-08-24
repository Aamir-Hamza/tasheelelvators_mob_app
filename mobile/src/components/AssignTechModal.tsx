import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { User } from '../services/types';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../context/I18nContext';

export function AssignTechModal({
  visible,
  technicians,
  onClose,
  onSelect,
}: {
  visible: boolean;
  technicians: User[];
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const { theme } = useTheme();
  const { t } = useI18n();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.title, { color: theme.text }]}>{t('selectTech')}</Text>
          {technicians.map((tech) => (
            <Pressable
              key={tech.id}
              onPress={() => onSelect(tech.id)}
              style={[styles.row, { borderColor: theme.border }]}
            >
              <View>
                <Text style={[styles.name, { color: theme.text }]}>{tech.name}</Text>
                <Text style={{ color: theme.muted }}>{tech.phone}</Text>
              </View>
              <Text style={{ color: theme.accent, fontWeight: '800' }}>{t('assign')}</Text>
            </Pressable>
          ))}
          <Pressable onPress={onClose} style={{ marginTop: 8 }}>
            <Text style={{ color: theme.muted, textAlign: 'center', fontWeight: '700' }}>{t('cancel')}</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  card: { borderRadius: 16, padding: 16 },
  title: { fontWeight: '800', fontSize: 16, marginBottom: 10 },
  row: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: { fontWeight: '700' },
});
