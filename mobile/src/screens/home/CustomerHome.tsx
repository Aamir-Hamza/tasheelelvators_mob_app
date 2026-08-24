import React, { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Screen } from '../../components/Screen';
import { ElevatorCard } from '../../components/ElevatorCard';
import { CreateFaultModal } from '../../components/CreateFaultModal';
import { api } from '../../services/api';
import { queryClient } from '../../services/queryClient';
import { useElevatorsQuery } from '../../services/useElevatorsQuery';
import { MaintenanceJob } from '../../services/types';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useTheme } from '../../theme/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { RootStackParamList } from '../../navigation/types';
import { liftRef } from '../../utils/format';

export function CustomerHome() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { theme } = useTheme();
  const toast = useToast();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [faultOpen, setFaultOpen] = useState(false);
  const [floor, setFloor] = useState('G');

  const elevators = useElevatorsQuery();
  const jobs = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => (await api.get('/maintenance')).data.data as MaintenanceJob[],
  });

  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: ['elevators'] });
      void queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    }, [])
  );

  const sos = useMutation({
    mutationFn: async () => {
      const first = elevators.data?.[0];
      if (!first) throw new Error('No elevator');
      return api.post('/emergencies', {
        elevatorId: first._id,
        floor,
        description: `Passenger SOS from ${first.liftId} (${first.building})`,
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
      toast.show(t('reportSubmitted'), 'success');
    },
  });

  const upcoming = (jobs.data ?? []).filter((j) => j.status !== 'completed');

  return (
    <Screen refreshing={elevators.isRefetching} onRefresh={() => elevators.refetch()}>
      <Text style={[styles.kicker, { color: theme.accent }]}>{user?.company}</Text>
      <Text style={[styles.hello, { color: theme.text }]}>{t('contractedLifts')}</Text>

      <View style={[styles.sosCard, { backgroundColor: theme.alert }]}>
        <Text style={styles.sosTitle}>{t('sos')}</Text>
        <Text style={styles.sosHint}>{t('sosHint')}</Text>
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

      <Pressable onPress={() => setFaultOpen(true)} style={[styles.report, { borderColor: theme.accent }]}>
        <Text style={{ color: theme.accent, fontWeight: '800' }}>{t('reportFault')}</Text>
      </Pressable>

      {(elevators.data ?? []).map((el) => (
        <ElevatorCard
          key={el._id}
          elevator={el}
          onPress={() => navigation.navigate('ElevatorDetail', { id: el._id })}
        />
      ))}

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

      <CreateFaultModal
        visible={faultOpen}
        onClose={() => setFaultOpen(false)}
        elevators={elevators.data ?? []}
        onSubmit={(payload) => createFault.mutate(payload)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: { fontWeight: '900', letterSpacing: 1 },
  hello: { fontSize: 22, fontWeight: '800', marginBottom: 14 },
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
