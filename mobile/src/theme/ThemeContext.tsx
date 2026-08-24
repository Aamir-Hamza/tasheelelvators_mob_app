import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppTheme, darkTheme, lightTheme } from './tokens';

type Mode = 'dark' | 'light';

interface ThemeContextValue {
  theme: AppTheme;
  mode: Mode;
  toggleTheme: () => void;
  setMode: (m: Mode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const KEY = 'tasheel.theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>('dark');

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v === 'light' || v === 'dark') setModeState(v);
    });
  }, []);

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
    AsyncStorage.setItem(KEY, m).catch(() => undefined);
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  const value = useMemo(
    () => ({
      theme: mode === 'dark' ? darkTheme : lightTheme,
      mode,
      toggleTheme,
      setMode,
    }),
    [mode, toggleTheme, setMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
