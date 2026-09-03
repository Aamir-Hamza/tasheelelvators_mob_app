import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { ElevatorCard } from '../components/ElevatorCard';
import { AddElevatorModal } from '../components/AddElevatorModal';
import { CreateFaultModal } from '../components/CreateFaultModal';
import { SearchField } from '../components/SearchField';
import { api } from '../services/api';
import { dropElevatorFromCache, queryClient } from '../services/queryClient';
import { useElevatorsQuery } from '../services/useElevatorsQuery';
import { Elevator } from '../services/types';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../theme/ThemeContext';
import { useToast } from '../context/ToastContext';
import { RootStackParamList } from '../navigation/types';
import { matchesElevatorSearch } from '../utils/format';

export function ElevatorsScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { theme } = useTheme();
  const toast = useToast();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [open, setOpen] = useState(false);
  const [faultOpen, setFaultOpen] = useState(false);
  const [reportId, setReportId] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Elevator | null>(null);
  const [pulling, setPulling] = useState(false);
  const query = useElevatorsQuery({ paused: faultOpen });

  useFocusEffect(
    useCallback(() => {
      void query.refetch();
    }, [query.refetch])
  );

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      editing ? api.patch(`/elevators/${editing._id}`, payload) : api.post('/elevators', payload),
    onSuccess: async () => {
      setOpen(false);
      setEditing(null);
      await query.refetch();
      void queryClient.invalidateQueries({ queryKey: ['fleet-stats'] });
      toast.show(editing ? t('saved') : t('created'), 'success');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed';
      toast.show(msg, 'error');
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/elevators/${id}`),
    onMutate: async (id) => {
      dropElevatorFromCache(id);
    },
    onSuccess: async (_res, id) => {
      dropElevatorFromCache(id);
      await query.refetch();
      toast.show(t('deleted'), 'success');
    },
    onError: async (err: unknown, id) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      dropElevatorFromCache(id);
      await query.refetch();
      if (status === 404) {
        toast.show(t('deleted'), 'success');
        return;
      }
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
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed';
      toast.show(msg, 'error');
    },
  });

  if (query.isLoading && !query.data) {
    return (
      <Screen scroll={false}>
        <ActivityIndicator color={theme.accent} />
      </Screen>
    );
  }

  const elevators = query.data ?? [];
  const filtered = elevators.filter((el) => matchesElevatorSearch(el, search));

  return (
    <View style={{ flex: 1 }}>
    <Screen
      refreshing={pulling}
      onRefresh={async () => {
        setPulling(true);
        try {
          await query.refetch();
        } finally {
          setPulling(false);
        }
      }}
    >
      <View style={styles.head}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>{t('registry')}</Text>
          <Text style={{ color: theme.muted, fontWeight: '700' }}>
            {filtered.length} {t('elevators')}
          </Text>
        </View>
        {user?.role === 'admin' ? (
          <Pressable
            onPress={() => {
              setEditing(null);
              setOpen(true);
            }}
            style={[styles.add, { backgroundColor: theme.accent }]}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addText}>{t('addElevator')}</Text>
          </Pressable>
        ) : user?.role === 'customer' ? (
          <Pressable onPress={() => setFaultOpen(true)} style={[styles.add, { backgroundColor: theme.accent }]}>
            <Ionicons name="warning-outline" size={16} color="#fff" />
            <Text style={styles.addText}>{t('reportProblem')}</Text>
          </Pressable>
        ) : null}
      </View>
      <SearchField value={search} onChangeText={setSearch} placeholder={t('searchPlaceholder')} />
      {filtered.length === 0 ? (
        <Text style={{ color: theme.muted }}>{search ? t('noMatchingElevators') : t('noData')}</Text>
      ) : (
        filtered.map((el) => (
          <ElevatorCard
            key={el._id}
            elevator={el}
            onPress={() => navigation.navigate('ElevatorDetail', { id: el._id })}
            onDelete={user?.role === 'admin' ? () => remove.mutate(el._id) : undefined}
            onReport={
              user?.role === 'customer'
                ? () => {
                    setReportId(el._id);
                    setFaultOpen(true);
                  }
                : undefined
            }
          />
        ))
      )}
      <AddElevatorModal
        visible={open}
        initial={editing}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSubmit={(payload) => save.mutate(payload)}
      />
    </Screen>
      <CreateFaultModal
        visible={faultOpen}
        onClose={() => setFaultOpen(false)}
        elevators={elevators}
        initialElevatorId={reportId}
        onSubmit={(payload) => createFault.mutate(payload)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800' },
  add: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  addText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});
