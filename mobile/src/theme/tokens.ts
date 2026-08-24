export const palette = {
  accent: '#ef6c00',
  accentSoft: '#ff8a33',
  alert: '#b42318',
  alertSoft: '#d92d20',
  success: '#12b76a',
  warning: '#f79009',
  info: '#2e90fa',
};

export type ThemeMode = 'dark' | 'light';

export type AppTheme = {
  mode: ThemeMode;
  bg: string;
  bgElevated: string;
  card: string;
  cardAlt: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
  alert: string;
  success: string;
  warning: string;
  info: string;
  inverse: string;
  tabBar: string;
  overlay: string;
};

export const darkTheme: AppTheme = {
  mode: 'dark',
  bg: '#0e1114',
  bgElevated: '#12171c',
  card: '#171b20',
  cardAlt: '#1d232a',
  text: '#f3f5f7',
  muted: '#9aa3ad',
  border: '#2a323b',
  accent: palette.accent,
  alert: palette.alert,
  success: palette.success,
  warning: palette.warning,
  info: palette.info,
  inverse: '#ffffff',
  tabBar: '#101418',
  overlay: 'rgba(0,0,0,0.55)',
};

export const lightTheme: AppTheme = {
  mode: 'light',
  bg: '#f3f5f7',
  bgElevated: '#e8ebef',
  card: '#ffffff',
  cardAlt: '#eef1f4',
  text: '#0e1114',
  muted: '#5d6770',
  border: '#d5dbe1',
  accent: palette.accent,
  alert: palette.alert,
  success: palette.success,
  warning: palette.warning,
  info: palette.info,
  inverse: '#ffffff',
  tabBar: '#ffffff',
  overlay: 'rgba(14,17,20,0.45)',
};

