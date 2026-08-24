import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../theme/ThemeContext';
import { useToast } from '../context/ToastContext';
import { API_BASE } from '../services/api';

const DEMOS = [
  { label: 'Admin', email: 'admin@tasheel.om' },
  { label: 'ONEIC', email: 'fatima@oneic.om' },
  { label: 'ABC Tower', email: 'ops@abctower.om' },
  { label: 'Ahmed K.', email: 'ahmed.k@tasheel.om' },
  { label: 'Salim A.', email: 'salim.a@tasheel.om' },
];

export function LoginScreen() {
  const { theme, mode } = useTheme();
  const { t } = useI18n();
  const { login } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('admin@tasheel.om');
  const [password, setPassword] = useState('Demo123!');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        `Cannot reach API at ${API_BASE}`;
      toast.show(message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.fill, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <View style={styles.inner}>
        <Text style={[styles.brand, { color: theme.accent }]}>{t('appName')}</Text>
        <Text style={[styles.sub, { color: theme.muted }]}>{t('appSubtitle')}</Text>
        <Text style={[styles.welcome, { color: theme.text }]}>{t('welcome')}</Text>
        <Text style={[styles.hint, { color: theme.muted }]}>{t('welcomeHint')}</Text>

        <Text style={[styles.label, { color: theme.muted }]}>{t('email')}</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor={theme.muted}
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
        />
        <Text style={[styles.label, { color: theme.muted }]}>{t('password')}</Text>
        <TextInput
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholderTextColor={theme.muted}
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
        />

        <Pressable onPress={submit} disabled={busy} style={[styles.cta, { backgroundColor: theme.accent }]}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>{t('login')}</Text>}
        </Pressable>

        <Text style={[styles.demoTitle, { color: theme.muted }]}>{t('demoAccounts')} · Demo123!</Text>
        <View style={styles.demos}>
          {DEMOS.map((d) => (
            <Pressable
              key={d.email}
              onPress={() => {
                setEmail(d.email);
                setPassword('Demo123!');
              }}
              style={[styles.demo, { borderColor: theme.border, backgroundColor: theme.card }]}
            >
              <Text style={{ color: theme.text, fontWeight: '700', fontSize: 12 }}>{d.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', padding: 22 },
  brand: { fontSize: 28, fontWeight: '900', letterSpacing: 3 },
  sub: { marginTop: 2, fontWeight: '600' },
  welcome: { marginTop: 28, fontSize: 22, fontWeight: '800' },
  hint: { marginTop: 6, marginBottom: 22 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12 },
  cta: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  demoTitle: { marginTop: 22, fontSize: 12, fontWeight: '700' },
  demos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  demo: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
});
