import React, { useMemo, useRef, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Elevator } from '../services/types';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { useToast } from '../context/ToastContext';
import { shrinkPhotoDataUrl } from '../utils/image';

const PRIORITIES = ['Normal', 'High', 'Critical'] as const;
const FAULT_TYPES = ['Door lock', 'Noise', 'Indicator', 'Not stopping', 'Door stuck', 'Other'];

export type FaultPayload = {
  elevatorId: string;
  faultType: string;
  priority: (typeof PRIORITIES)[number];
  description: string;
  mediaUrl?: string;
};

interface Props {
  visible: boolean;
  onClose: () => void;
  elevators: Elevator[];
  initialElevatorId?: string;
  onSubmit: (payload: FaultPayload) => void;
}

export function CreateFaultModal({ visible, onClose, elevators, initialElevatorId, onSubmit }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      {visible ? (
        <FaultForm
          elevators={elevators}
          initialElevatorId={initialElevatorId}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      ) : null}
    </Modal>
  );
}

function FaultForm({
  elevators,
  initialElevatorId,
  onClose,
  onSubmit,
}: {
  elevators: Elevator[];
  initialElevatorId?: string;
  onClose: () => void;
  onSubmit: (payload: FaultPayload) => void;
}) {
  const { theme } = useTheme();
  const { t } = useI18n();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const lifts = useRef(elevators).current;
  const [search, setSearch] = useState('');
  const [elevatorId, setElevatorId] = useState(initialElevatorId || lifts[0]?._id || '');
  const [faultType, setFaultType] = useState('');
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>('Normal');
  const [description, setDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | undefined>();

  const filtered = useMemo(
    () =>
      lifts.filter((e) =>
        `${e.liftId} ${e.building} ${e.location} ${e.customerName}`
          .toLowerCase()
          .includes(search.trim().toLowerCase())
      ),
    [lifts, search]
  );

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.3,
      base64: true,
      exif: false,
    });
    if (result.canceled || !result.assets[0]?.base64) return;
    const raw = `data:image/jpeg;base64,${result.assets[0].base64}`;
    const compact = await shrinkPhotoDataUrl(raw);
    if (!compact) {
      toast.show(t('photoTooLarge'), 'error');
      return;
    }
    setMediaUrl(compact);
  };

  const submit = () => {
    if (!elevatorId) {
      toast.show(t('selectElevator'), 'error');
      return;
    }
    if (!faultType.trim() || !description.trim()) {
      toast.show(t('fillFaultDetails'), 'error');
      return;
    }
    onSubmit({
      elevatorId,
      faultType: faultType.trim(),
      priority,
      description: description.trim(),
      mediaUrl,
    });
    onClose();
  };

  return (
    <View style={styles.overlay}>
      <View style={[styles.sheet, { backgroundColor: theme.card }]}>
        <Text style={[styles.title, { color: theme.text }]}>{t('reportFault')}</Text>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
        >
          <Text style={[styles.label, { color: theme.muted }]}>{t('selectElevator')}</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('searchPlaceholder')}
            placeholderTextColor={theme.muted}
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.cardAlt, marginBottom: 8 }]}
          />
          <View style={styles.chips}>
            {filtered.map((e) => (
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
                <Text style={{ color: elevatorId === e._id ? '#fff' : theme.text, fontWeight: '700', fontSize: 12 }}>{e.liftId}</Text>
                <Text style={{ color: elevatorId === e._id ? '#fff' : theme.muted, fontSize: 10 }}>{e.building}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: theme.muted }]}>{t('faultType')}</Text>
          <View style={styles.chips}>
            {FAULT_TYPES.map((type) => {
              const selected =
                faultType === type || (type === 'Other' && !!faultType && !FAULT_TYPES.slice(0, -1).includes(faultType));
              return (
                <Pressable
                  key={type}
                  onPress={() => setFaultType(type === 'Other' ? '' : type)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected ? theme.accent : theme.cardAlt,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={{ color: selected ? '#fff' : theme.text, fontWeight: '700', fontSize: 12 }}>{type}</Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            value={faultType}
            onChangeText={setFaultType}
            placeholder="Door lock / Noise / Indicator"
            placeholderTextColor={theme.muted}
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.cardAlt }]}
          />

          <Text style={[styles.label, { color: theme.muted, marginTop: 8 }]}>{t('priority')}</Text>
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
                <Text style={{ color: priority === p ? '#fff' : theme.text, fontWeight: '700', fontSize: 12 }}>{p}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: theme.muted }]}>{t('description')}</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
            placeholder={t('description')}
            placeholderTextColor={theme.muted}
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.border, backgroundColor: theme.cardAlt, minHeight: 72 },
            ]}
          />
          <Pressable onPress={pick} style={[styles.photoBtn, { borderColor: theme.border }]}>
            <Text style={{ color: theme.accent, fontWeight: '700', fontSize: 13 }}>{t('attachPhoto')}</Text>
          </Pressable>
          {mediaUrl ? (
            <Image source={{ uri: mediaUrl }} style={styles.preview} resizeMode="cover" />
          ) : (
            <Text style={{ color: theme.muted, marginBottom: 8, fontSize: 12 }}>{t('noPhoto')}</Text>
          )}
        </ScrollView>
        <View style={[styles.footer, { borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom, 8) + 64 }]}>
          <Pressable onPress={onClose} style={[styles.btn, { borderColor: theme.border }]}>
            <Text style={{ color: theme.muted, fontWeight: '700', fontSize: 13 }}>{t('cancel')}</Text>
          </Pressable>
          <Pressable
            onPress={submit}
            style={[styles.btn, { backgroundColor: theme.accent, borderColor: theme.accent, flex: 1.15 }]}
          >
            <Text style={styles.submitText}>{t('submit')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    height: '88%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  title: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 12 },
  label: { fontSize: 11, fontWeight: '700', marginBottom: 6, marginTop: 6 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  photoBtn: { borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginVertical: 8 },
  preview: { height: 80, borderRadius: 10, marginBottom: 8, width: '100%' },
  footer: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});
