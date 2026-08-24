import React from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Screen } from '../components/Screen';
import { HealthScoreCircle } from '../components/HealthScoreCircle';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../services/api';
import { dropElevatorFromCache } from '../services/queryClient';
import { Elevator } from '../services/types';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../theme/ThemeContext';
import { useToast } from '../context/ToastContext';
import { RootStackParamList } from '../navigation/types';

export function ElevatorDetailScreen() {
  const { t } = useI18n();
  const { theme } = useTheme();
  const { user } = useAuth();
  const toast = useToast();
  const route = useRoute<RouteProp<RootStackParamList, 'ElevatorDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const query = useQuery({
    queryKey: ['elevator', route.params.id],
    queryFn: async () => (await api.get(`/elevators/${route.params.id}`)).data.data as Elevator,
  });

  const remove = useMutation({
    mutationFn: () => api.delete(`/elevators/${route.params.id}`),
    onSuccess: () => {
      dropElevatorFromCache(route.params.id);
      toast.show(t('deleted'), 'success');
      navigation.goBack();
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        dropElevatorFromCache(route.params.id);
        toast.show(t('deleted'), 'success');
        navigation.goBack();
        return;
      }
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

  const el = query.data;
  const rows: [string, string][] = [
    [t('customer'), el.customerName],
    [t('building'), el.building],
    [t('location'), el.location],
    [t('controller'), el.controllerType],
    [t('capacity'), `${el.capacity} ${t('kg')}`],
    [t('speed'), `${el.speed} ${t('ms')}`],
    [t('stops'), String(el.stops)],
    [t('iotGateway'), el.iotStatus.toUpperCase()],
  ];

  return (
    <Screen>
      <View style={styles.head}>
        <View>
          <Text style={[styles.id, { color: theme.text }]}>{el.liftId}</Text>
          <StatusBadge status={el.status} />
        </View>
        <HealthScoreCircle score={el.healthScore} size={110} />
      </View>
      {rows.map(([k, v]) => (
        <View key={k} style={[styles.row, { borderColor: theme.border }]}>
          <Text style={{ color: theme.muted, fontWeight: '700' }}>{k}</Text>
          <Text style={{ color: theme.text, fontWeight: '700' }}>{v}</Text>
        </View>
      ))}
      <Pressable
        onPress={() => navigation.navigate('Telemetry', { id: el._id })}
        style={[styles.cta, { backgroundColor: theme.accent }]}
      >
        <Text style={styles.ctaText}>{t('telemetry')}</Text>
      </Pressable>
      {user?.role === 'admin' ? (
        <Pressable
          onPress={() =>
            Alert.alert(t('delete'), el.liftId, [
              { text: t('cancel'), style: 'cancel' },
              { text: t('delete'), style: 'destructive', onPress: () => remove.mutate() },
            ])
          }
          style={[styles.cta, { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.alert }]}
        >
          <Text style={{ color: theme.alert, fontWeight: '800' }}>{t('delete')}</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  id: { fontSize: 26, fontWeight: '900', marginBottom: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  cta: { marginTop: 18, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '800' },
});
