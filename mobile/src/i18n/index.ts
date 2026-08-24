import { I18nManager } from 'react-native';
import { en } from './en';
import { ar } from './ar';

export type Locale = 'en' | 'ar';
export type MessageKey = keyof typeof en;

const dictionaries: Record<Locale, typeof en> = { en, ar };

export function translate(locale: Locale, key: MessageKey): string {
  return dictionaries[locale][key] ?? dictionaries.en[key];
}

export function applyRtl(locale: Locale) {
  const rtl = locale === 'ar';
  I18nManager.allowRTL(rtl);
  if (I18nManager.isRTL !== rtl) {
    I18nManager.forceRTL(rtl);
    return true;
  }
  return false;
}

export function isRtlLocale(locale: Locale) {
  return locale === 'ar';
}
