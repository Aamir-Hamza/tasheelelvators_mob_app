import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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
import { API_BASE, persistApiBase } from '../services/api';
import { apiErrorMessage } from '../services/session';
import { Role } from '../services/types';

const DEMOS: { label: string; email: string; role: Role }[] = [
  { label: 'Fatima', email: 'fatima@oneic.om', role: 'customer' },
  { label: 'ABC Tower', email: 'ops@abctower.om', role: 'customer' },
  { label: 'Admin', email: 'admin@tasheel.om', role: 'admin' },
  { label: 'Ahmed K.', email: 'ahmed.k@tasheel.om', role: 'technician' },
  { label: 'Salim A.', email: 'salim.a@tasheel.om', role: 'technician' },
];

const ROLE_CHIPS: { role: Role; key: 'loginAsUser' | 'loginAsAdmin' | 'loginAsTechnician' }[] = [
  { role: 'customer', key: 'loginAsUser' },
  { role: 'admin', key: 'loginAsAdmin' },
  { role: 'technician', key: 'loginAsTechnician' },
];

export function LoginScreen() {
  const { theme, mode } = useTheme();
  const { t } = useI18n();
  const { login, registerUser } = useAuth();
  const toast = useToast();
  const [role, setRole] = useState<Role>('customer');
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState('fatima@oneic.om');
  const [password, setPassword] = useState('Demo123!');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [apiUrl, setApiUrl] = useState(API_BASE);
  const [busy, setBusy] = useState(false);

  const demos = useMemo(() => DEMOS.filter((d) => d.role === role), [role]);

  const pickRole = (next: Role) => {
    setRole(next);
    setSignup(false);
    const first = DEMOS.find((d) => d.role === next);
    if (first) {
      setEmail(first.email);
      setPassword('Demo123!');
    }
  };

  const submit = async () => {
    if (signup && role === 'customer') {
      if (!name.trim() || !email.trim() || !password || !phone.trim()) {
        toast.show(t('fillRequired'), 'error');
        return;
      }
      if (password.length < 6) {
        toast.show(t('passwordShort'), 'error');
        return;
      }
    } else if (!email.trim() || !password) {
      toast.show(t('fillRequired'), 'error');
      return;
    }

    setBusy(true);
    try {
      await persistApiBase(apiUrl.trim() || API_BASE);
      if (signup && role === 'customer') {
        await registerUser({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          company: company.trim() || undefined,
        });
      } else {
        await login(email.trim(), password, role);
      }
    } catch (err: unknown) {
      if ((err as { code?: string }).code === 'WRONG_ROLE') {
        toast.show(t('wrongRole'), 'error');
        return;
      }
      toast.show(apiErrorMessage(err, `Cannot reach API at ${API_BASE}`), 'error');
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
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={[styles.brand, { color: theme.accent }]}>{t('appName')}</Text>
        <Text style={[styles.sub, { color: theme.muted }]}>{t('appSubtitle')}</Text>
        <Text style={[styles.welcome, { color: theme.text }]}>
          {signup ? t('createAccount') : t('welcome')}
        </Text>
        <Text style={[styles.hint, { color: theme.muted }]}>
          {signup ? t('signUpHint') : t('welcomeUserHint')}
        </Text>

        <View style={styles.roles}>
          {ROLE_CHIPS.map((item) => (
            <Pressable
              key={item.role}
              onPress={() => pickRole(item.role)}
              style={[
                styles.role,
                {
                  backgroundColor: role === item.role ? theme.accent : theme.card,
                  borderColor: role === item.role ? theme.accent : theme.border,
                },
              ]}
            >
              <Text style={{ color: role === item.role ? '#fff' : theme.text, fontWeight: '800', fontSize: 12 }}>
                {t(item.key)}
              </Text>
            </Pressable>
          ))}
        </View>

        {signup ? (
          <>
            <Text style={[styles.label, { color: theme.muted }]}>{t('fullName')}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('fullName')}
              placeholderTextColor={theme.muted}
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
            />
            <Text style={[styles.label, { color: theme.muted }]}>{t('phone')}</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder={t('phone')}
              placeholderTextColor={theme.muted}
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
            />
            <Text style={[styles.label, { color: theme.muted }]}>{t('companyOptional')}</Text>
            <TextInput
              value={company}
              onChangeText={setCompany}
              placeholder={t('companyOptional')}
              placeholderTextColor={theme.muted}
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
            />
          </>
        ) : null}

        <Text style={[styles.label, { color: theme.muted }]}>{t('apiServer')}</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          value={apiUrl}
          onChangeText={setApiUrl}
          placeholder="http://192.168.100.128:4000"
          placeholderTextColor={theme.muted}
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
        />

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
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>{signup ? t('register') : t('login')}</Text>
          )}
        </Pressable>

        {role === 'customer' ? (
          <Pressable
            onPress={() => {
              setSignup((v) => {
                const next = !v;
                if (next) {
                  setEmail('');
                  setPassword('');
                }
                return next;
              });
            }}
            style={styles.toggle}
          >
            <Text style={{ color: theme.accent, fontWeight: '700' }}>
              {signup ? t('haveAccount') : t('createAccount')}
            </Text>
          </Pressable>
        ) : null}

        {!signup ? (
          <>
            <Text style={[styles.demoTitle, { color: theme.muted }]}>{t('demoAccounts')} · Demo123!</Text>
            <View style={styles.demos}>
              {demos.map((d) => (
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
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 22 },
  brand: { fontSize: 28, fontWeight: '900', letterSpacing: 3 },
  sub: { marginTop: 2, fontWeight: '600' },
  welcome: { marginTop: 28, fontSize: 22, fontWeight: '800' },
  hint: { marginTop: 6, marginBottom: 18 },
  roles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  role: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12 },
  cta: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  toggle: { alignItems: 'center', marginTop: 14 },
  demoTitle: { marginTop: 22, fontSize: 12, fontWeight: '700' },
  demos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  demo: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
});
