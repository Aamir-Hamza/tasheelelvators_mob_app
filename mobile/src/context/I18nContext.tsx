import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, DevSettings } from 'react-native';
import { Locale, MessageKey, applyRtl, translate } from '../i18n';

interface I18nValue {
  locale: Locale;
  t: (key: MessageKey) => string;
  setLocale: (locale: Locale) => Promise<void>;
  isRTL: boolean;
}

const I18nContext = createContext<I18nValue | undefined>(undefined);
const KEY = 'tasheel.locale';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v === 'en' || v === 'ar') {
        setLocaleState(v);
        applyRtl(v);
      }
    });
  }, []);

  const setLocale = useCallback(async (next: Locale) => {
    await AsyncStorage.setItem(KEY, next);
    setLocaleState(next);
    const needsReload = applyRtl(next);
    if (needsReload) {
      Alert.alert(
        next === 'ar' ? 'العربية' : 'English',
        next === 'ar'
          ? 'ستُطبَّق اللغة بالكامل بعد إعادة تشغيل التطبيق.'
          : 'Language will apply fully after restarting the app.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (__DEV__) DevSettings.reload();
            },
          },
        ]
      );
    }
  }, []);

  const value = useMemo(
    () => ({
      locale,
      t: (key: MessageKey) => translate(locale, key),
      setLocale,
      isRTL: locale === 'ar',
    }),
    [locale, setLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
