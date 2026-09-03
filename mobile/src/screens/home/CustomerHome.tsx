import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Screen } from '../../components/Screen';
import { ElevatorCard } from '../../components/ElevatorCard';
import { CreateFaultModal } from '../../components/CreateFaultModal';
import { SearchField } from '../../components/SearchField';
import { api } from '../../services/api';
import { queryClient } from '../../services/queryClient';
import { useElevatorsQuery } from '../../services/useElevatorsQuery';
import { FaultTicket, MaintenanceJob } from '../../services/types';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useTheme } from '../../theme/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { liftRef, matchesElevatorSearch } from '../../utils/format';

export function CustomerHome() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { theme } = useTheme();
  const toast = useToast();
  const [faultOpen, setFaultOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [floor, setFloor] = useState('G');
  const [pulling, setPulling] = useState(false);

  const elevators = useElevatorsQuery({ paused: faultOpen });
  const jobs = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => (await api.get('/maintenance')).data.data as MaintenanceJob[],
  });
  const reports = useQuery({
    queryKey: ['faults'],
    queryFn: async () => (await api.get('/faults')).data.data as FaultTicket[],
  });

  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: ['elevators'] });
      void queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      void queryClient.invalidateQueries({ queryKey: ['faults'] });
    }, [])
  );

  const list = elevators.data ?? [];
  const filtered = useMemo(() => list.filter((el) => matchesElevatorSearch(el, search)), [list, search]);
  const selected = list.find((el) => el._id === selectedId) ?? filtered[0] ?? list[0];

  const sos = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error('No elevator');
      return api.post('/emergencies', {
        elevatorId: selected._id,
        floor,
        description: `Passenger SOS from ${selected.liftId} (${selected.building})`,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['emergency-active'] });
      void queryClient.invalidateQueries({ queryKey: ['emergencies'] });
      toast.show(t('sosSent'), 'success');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed';
      toast.show(msg, 'error');
    },
  });

  const createFault = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.post('/faults', payload),
    onSuccess: () => {
      setFaultOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['faults'] });
      void queryClient.invalidateQueries({ queryKey: ['elevators'] });
      toast.show(t('reportSubmitted'), 'success');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed';
      toast.show(msg, 'error');
    },
  });

  const upcoming = (jobs.data ?? []).filter((j) => j.status !== 'completed');

  return (
    <View style={{ flex: 1 }}>
    <Screen
      refreshing={pulling}
      onRefresh={async () => {
        setPulling(true);
        try {
          await elevators.refetch();
        } finally {
          setPulling(false);
        }
      }}
    >
      <Text style={[styles.kicker, { color: theme.accent }]}>{user?.company || t('roleCustomer')}</Text>
      <Text style={[styles.hello, { color: theme.text }]}>{t('contractedLifts')}</Text>
      <Text style={{ color: theme.muted, marginBottom: 12 }}>{t('tapToSelect')}</Text>

      <SearchField value={search} onChangeText={setSearch} placeholder={t('searchPlaceholder')} />

      <View style={[styles.sosCard, { backgroundColor: theme.alert }]}>
        <Text style={styles.sosTitle}>{t('sos')}</Text>
        <Text style={styles.sosHint}>
          {selected ? `${t('selectedLift')}: ${selected.liftId} · ${selected.building}` : t('sosHint')}
        </Text>
        <TextInput
          value={floor}
          onChangeText={setFloor}
          placeholder={t('floor')}
          placeholderTextColor="#ffd7d0"
          style={styles.floor}
        />
        <Pressable
          style={styles.sosBtn}
          onPress={() => {
            if (!selected) {
              toast.show(t('selectElevator'), 'error');
              return;
            }
            Alert.alert(t('confirmSos'), t('confirmSosBody'), [
              { text: t('cancel'), style: 'cancel' },
              {
                text: t('triggerSos'),
                style: 'destructive',
                onPress: async () => {
                  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                  sos.mutate();
                },
              },
            ]);
          }}
        >
          <Text style={styles.sosBtnText}>{t('triggerSos')}</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => setFaultOpen(true)}
        hitSlop={8}
        style={[styles.report, { borderColor: theme.accent, backgroundColor: theme.card }]}
      >
        <Text style={{ color: theme.accent, fontWeight: '800' }}>{t('reportProblem')}</Text>
      </Pressable>

      {filtered.length === 0 ? (
        <Text style={{ color: theme.muted, marginBottom: 12 }}>{t('noMatchingElevators')}</Text>
      ) : (
        filtered.map((el) => (
          <ElevatorCard
            key={el._id}
            elevator={el}
            selected={selected?._id === el._id}
            onPress={() => setSelectedId(el._id)}
            onReport={() => {
              setSelectedId(el._id);
              setFaultOpen(true);
            }}
          />
        ))
      )}

      <Text style={[styles.section, { color: theme.text }]}>{t('yourReports')}</Text>
      {(reports.data ?? []).length === 0 ? (
        <Text style={{ color: theme.muted }}>{t('noData')}</Text>
      ) : (
        (reports.data ?? []).slice(0, 6).map((f) => (
          <View key={f._id} style={[styles.job, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={{ color: theme.text, fontWeight: '800' }}>
              {f.ticketId} · {liftRef(f.elevatorId).liftId}
            </Text>
            <Text style={{ color: theme.muted }}>
              {f.faultType} · {f.status}
            </Text>
          </View>
        ))
      )}

      <Text style={[styles.section, { color: theme.text }]}>{t('upcomingPm')}</Text>
      {upcoming.length === 0 ? (
        <Text style={{ color: theme.muted }}>{t('noData')}</Text>
      ) : (
        upcoming.map((j) => (
          <View key={j._id} style={[styles.job, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={{ color: theme.text, fontWeight: '800' }}>
              {j.jobId} · {liftRef(j.elevatorId).liftId}
            </Text>
            <Text style={{ color: theme.muted }}>{new Date(j.scheduledDate).toLocaleString()}</Text>
          </View>
        ))
      )}
    </Screen>
      <CreateFaultModal
        visible={faultOpen}
        onClose={() => setFaultOpen(false)}
        elevators={list}
        initialElevatorId={selected?._id}
        onSubmit={(payload) => createFault.mutate(payload)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: { fontWeight: '900', letterSpacing: 1 },
  hello: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  sosCard: { borderRadius: 16, padding: 16, marginBottom: 12 },
  sosTitle: { color: '#fff', fontWeight: '900', fontSize: 18, letterSpacing: 1 },
  sosHint: { color: '#ffd7d0', marginTop: 4, marginBottom: 10 },
  floor: {
    borderWidth: 1,
    borderColor: '#ffd7d0',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  sosBtn: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  sosBtnText: { color: '#b42318', fontWeight: '900' },
  report: { borderWidth: 1, borderRadius: 12, padding: 12, alignItems: 'center', marginBottom: 14 },
  section: { fontWeight: '800', fontSize: 16, marginVertical: 10 },
  job: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
});
