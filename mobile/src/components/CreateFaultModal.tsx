import React, { useEffect, useState } from 'react';
import {
  Image,
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
import * as ImagePicker from 'expo-image-picker';
import { Elevator } from '../services/types';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../context/I18nContext';

const PRIORITIES = ['Normal', 'High', 'Critical'] as const;

interface Props {
  visible: boolean;
  onClose: () => void;
  elevators: Elevator[];
  onSubmit: (payload: {
    elevatorId: string;
    faultType: string;
    priority: (typeof PRIORITIES)[number];
    description: string;
    mediaUrl?: string;
  }) => void;
}

export function CreateFaultModal({ visible, onClose, elevators, onSubmit }: Props) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [elevatorId, setElevatorId] = useState(elevators[0]?._id ?? '');
  const [faultType, setFaultType] = useState('');
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>('Normal');
  const [description, setDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | undefined>();

  useEffect(() => {
    if (!elevatorId && elevators[0]?._id) setElevatorId(elevators[0]._id);
  }, [elevators, elevatorId]);

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.45,
      base64: true,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      setMediaUrl(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.card }]}>
          <Text style={[styles.title, { color: theme.text }]}>{t('reportFault')}</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={[styles.label, { color: theme.muted }]}>{t('selectElevator')}</Text>
            <View style={styles.chips}>
              {elevators.map((e) => (
                <Pressable
                  key={e._id}
                  onPress={() => setElevatorId(e._id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: elevatorId === e._id ? theme.accent : theme.cardAlt,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={{ color: elevatorId === e._id ? '#fff' : theme.text, fontWeight: '700' }}>
                    {e.liftId}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.label, { color: theme.muted }]}>{t('faultType')}</Text>
            <TextInput
              value={faultType}
              onChangeText={setFaultType}
              placeholder="Door lock / Noise / Indicator"
              placeholderTextColor={theme.muted}
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.cardAlt }]}
            />
            <Text style={[styles.label, { color: theme.muted, marginTop: 10 }]}>{t('priority')}</Text>
            <View style={styles.chips}>
              {PRIORITIES.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setPriority(p)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: priority === p ? theme.accent : theme.cardAlt,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={{ color: priority === p ? '#fff' : theme.text, fontWeight: '700' }}>{p}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.label, { color: theme.muted }]}>{t('description')}</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              style={[
                styles.input,
                { color: theme.text, borderColor: theme.border, backgroundColor: theme.cardAlt, minHeight: 90 },
              ]}
            />
            <Pressable onPress={pick} style={[styles.photoBtn, { borderColor: theme.border }]}>
              <Text style={{ color: theme.accent, fontWeight: '700' }}>{t('attachPhoto')}</Text>
            </Pressable>
            {mediaUrl ? (
              <Image source={{ uri: mediaUrl }} style={styles.preview} />
            ) : (
              <Text style={{ color: theme.muted, marginBottom: 8 }}>{t('noPhoto')}</Text>
            )}
          </ScrollView>
          <View style={styles.actions}>
            <Pressable onPress={onClose} style={[styles.btn, { borderColor: theme.border }]}>
              <Text style={{ color: theme.muted, fontWeight: '700' }}>{t('cancel')}</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                onSubmit({ elevatorId, faultType, priority, description, mediaUrl })
              }
              style={[styles.btn, { backgroundColor: theme.accent, borderColor: theme.accent }]}
            >
              <Text style={{ color: '#fff', fontWeight: '800' }}>{t('submit')}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { maxHeight: '90%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  photoBtn: { borderWidth: 1, borderRadius: 10, padding: 12, alignItems: 'center', marginVertical: 10 },
  preview: { height: 120, borderRadius: 10, marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
});
