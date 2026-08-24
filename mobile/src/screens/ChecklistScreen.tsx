import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../components/Screen';
import { MaintenanceChecklist } from '../components/MaintenanceChecklist';
import { api } from '../services/api';
import { ChecklistItem, MaintenanceJob } from '../services/types';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../theme/ThemeContext';
import { useToast } from '../context/ToastContext';
import { RootStackParamList } from '../navigation/types';
import { liftRef } from '../utils/format';

export function ChecklistScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { theme } = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const route = useRoute<RouteProp<RootStackParamList, 'Checklist'>>();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [name, setName] = useState(user?.name ?? '');
  const [notes, setNotes] = useState('');

  const query = useQuery({
    queryKey: ['job', route.params.id],
    queryFn: async () => (await api.get(`/maintenance/${route.params.id}`)).data.data as MaintenanceJob,
  });

  useEffect(() => {
    if (query.data) {
      setItems(query.data.checklist);
      setNotes(query.data.notes ?? '');
    }
  }, [query.data]);

  const saveList = useMutation({
    mutationFn: (checklist: ChecklistItem[]) =>
      api.patch(`/maintenance/${route.params.id}/checklist`, { checklist }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job', route.params.id] });
      qc.invalidateQueries({ queryKey: ['maintenance'] });
    },
  });

  const sign = useMutation({
    mutationFn: () =>
      api.patch(`/maintenance/${route.params.id}/signoff`, { signedOffBy: name, notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job', route.params.id] });
      qc.invalidateQueries({ queryKey: ['maintenance'] });
      qc.invalidateQueries({ queryKey: ['pm-stats'] });
      toast.show(t('reportSigned'), 'success');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed';
      toast.show(msg, 'error');
    },
  });

  if (!query.data) {
    return (
      <Screen scroll={false}>
        <ActivityIndicator color={theme.accent} />
      </Screen>
    );
  }

  const job = query.data;
  const readOnly = job.status === 'completed' || user?.role === 'customer';

  return (
    <Screen>
      <Text style={[styles.title, { color: theme.text }]}>{t('checklist')}</Text>
      <Text style={{ color: theme.muted, marginBottom: 12 }}>
        {job.jobId} · {liftRef(job.elevatorId).liftId} · {liftRef(job.elevatorId).building}
      </Text>
      <MaintenanceChecklist
        items={items}
        readOnly={readOnly}
        onToggle={(index) => {
          const next = items.map((item, i) => (i === index ? { ...item, completed: !item.completed } : item));
          setItems(next);
          saveList.mutate(next);
        }}
      />
      {!readOnly ? (
        <View>
          <Text style={[styles.label, { color: theme.muted }]}>{t('signOffName')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
          />
          <Text style={[styles.label, { color: theme.muted }]}>{t('notes')}</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            multiline
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.border, backgroundColor: theme.card, minHeight: 80 },
            ]}
          />
          <Pressable onPress={() => sign.mutate()} style={[styles.cta, { backgroundColor: theme.accent }]}>
            <Text style={styles.ctaText}>{t('signOff')}</Text>
          </Pressable>
        </View>
      ) : job.signedOffBy ? (
        <Text style={{ color: theme.success, fontWeight: '700' }}>
          {t('completed')} · {job.signedOffBy}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800' },
  label: { fontSize: 12, fontWeight: '700', marginTop: 10, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  cta: { marginTop: 14, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '800' },
});
