import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ControllerType, Elevator } from '../services/types';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../context/I18nContext';

const CONTROLLERS: ControllerType[] = ['Monarch', 'Arkel', 'STEP'];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => void;
  initial?: Elevator | null;
}

export function AddElevatorModal({ visible, onClose, onSubmit, initial }: Props) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [liftId, setLiftId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [building, setBuilding] = useState('');
  const [location, setLocation] = useState('');
  const [controllerType, setControllerType] = useState<ControllerType>('Monarch');
  const [capacity, setCapacity] = useState('1000');
  const [speed, setSpeed] = useState('1.6');
  const [stops, setStops] = useState('8');

  useEffect(() => {
    if (initial) {
      setLiftId(initial.liftId);
      setCustomerName(initial.customerName);
      setBuilding(initial.building);
      setLocation(initial.location);
      setControllerType(initial.controllerType);
      setCapacity(String(initial.capacity));
      setSpeed(String(initial.speed));
      setStops(String(initial.stops));
    } else {
      setLiftId('');
      setCustomerName('');
      setBuilding('');
      setLocation('');
      setControllerType('Monarch');
      setCapacity('1000');
      setSpeed('1.6');
      setStops('8');
    }
  }, [initial, visible]);

  const field = (label: string, value: string, onChange: (v: string) => void, keyboardType?: 'default' | 'numeric' | 'decimal-pad') => (
    <View style={{ marginBottom: 10 }}>
      <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        placeholderTextColor={theme.muted}
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.cardAlt }]}
      />
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.card }]}>
          <Text style={[styles.title, { color: theme.text }]}>
            {initial ? t('editElevator') : t('addElevator')}
          </Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            {field(t('liftId'), liftId, setLiftId)}
            {field(t('customer'), customerName, setCustomerName)}
            {field(t('building'), building, setBuilding)}
            {field(t('location'), location, setLocation)}
            <Text style={[styles.label, { color: theme.muted }]}>{t('controller')}</Text>
            <View style={styles.chips}>
              {CONTROLLERS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setControllerType(c)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: controllerType === c ? theme.accent : theme.cardAlt,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={{ color: controllerType === c ? '#fff' : theme.text, fontWeight: '700' }}>{c}</Text>
                </Pressable>
              ))}
            </View>
            {field(t('capacity'), capacity, setCapacity, 'numeric')}
            {field(t('speed'), speed, setSpeed, 'decimal-pad')}
            {field(t('stops'), stops, setStops, 'numeric')}
          </ScrollView>
          <View style={styles.actions}>
            <Pressable onPress={onClose} style={[styles.btn, { borderColor: theme.border }]}>
              <Text style={{ color: theme.muted, fontWeight: '700' }}>{t('cancel')}</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                onSubmit({
                  liftId,
                  customerName,
                  building,
                  location,
                  controllerType,
                  capacity: Number(capacity),
                  speed: Number(speed),
                  stops: Number(stops),
                  iotStatus: 'online',
                  healthScore: 100,
                  status: 'operational',
                })
              }
              style={[styles.btn, { backgroundColor: theme.accent, borderColor: theme.accent }]}
            >
              <Text style={{ color: '#fff', fontWeight: '800' }}>{t('save')}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { maxHeight: '88%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
});
