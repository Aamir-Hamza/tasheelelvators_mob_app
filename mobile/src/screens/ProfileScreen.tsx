import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../theme/ThemeContext';
import { API_BASE } from '../services/api';

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const { theme, mode, setMode } = useTheme();

  const roleLabel =
    user?.role === 'admin' ? t('roleAdmin') : user?.role === 'customer' ? t('roleCustomer') : t('roleTechnician');

  return (
    <Screen>
      <Text style={[styles.title, { color: theme.text }]}>{t('profile')}</Text>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.name, { color: theme.text }]}>{user?.name}</Text>
        <Text style={{ color: theme.accent, fontWeight: '800' }}>{roleLabel}</Text>
        <Text style={{ color: theme.muted, marginTop: 6 }}>{user?.email}</Text>
        <Text style={{ color: theme.muted }}>{user?.phone}</Text>
        {user?.company ? <Text style={{ color: theme.muted }}>{user.company}</Text> : null}
      </View>

      <Text style={[styles.section, { color: theme.text }]}>{t('language')}</Text>
      <View style={styles.row}>
        <Pressable
          onPress={() => setLocale('en')}
          style={[styles.opt, { backgroundColor: locale === 'en' ? theme.accent : theme.card, borderColor: theme.border }]}
        >
          <Text style={{ color: locale === 'en' ? '#fff' : theme.text, fontWeight: '800' }}>{t('english')}</Text>
        </Pressable>
        <Pressable
          onPress={() => setLocale('ar')}
          style={[styles.opt, { backgroundColor: locale === 'ar' ? theme.accent : theme.card, borderColor: theme.border }]}
        >
          <Text style={{ color: locale === 'ar' ? '#fff' : theme.text, fontWeight: '800' }}>{t('arabic')}</Text>
        </Pressable>
      </View>

      <Text style={[styles.section, { color: theme.text }]}>{t('theme')}</Text>
      <View style={styles.row}>
        <Pressable
          onPress={() => setMode('dark')}
          style={[styles.opt, { backgroundColor: mode === 'dark' ? theme.accent : theme.card, borderColor: theme.border }]}
        >
          <Text style={{ color: mode === 'dark' ? '#fff' : theme.text, fontWeight: '800' }}>{t('dark')}</Text>
        </Pressable>
        <Pressable
          onPress={() => setMode('light')}
          style={[styles.opt, { backgroundColor: mode === 'light' ? theme.accent : theme.card, borderColor: theme.border }]}
        >
          <Text style={{ color: mode === 'light' ? '#fff' : theme.text, fontWeight: '800' }}>{t('light')}</Text>
        </Pressable>
      </View>

      <Text style={{ color: theme.muted, marginTop: 16, fontSize: 12 }}>API {API_BASE}</Text>

      <Pressable onPress={logout} style={[styles.out, { borderColor: theme.alert }]}>
        <Text style={{ color: theme.alert, fontWeight: '800' }}>{t('logout')}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16 },
  name: { fontSize: 20, fontWeight: '800' },
  section: { fontWeight: '800', marginBottom: 8, marginTop: 4 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  opt: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  out: { marginTop: 24, borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
});
