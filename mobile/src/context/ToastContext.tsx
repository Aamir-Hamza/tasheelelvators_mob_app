import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

type Kind = 'success' | 'error' | 'info';

interface ToastValue {
  show: (message: string, kind?: Kind) => void;
}

const ToastContext = createContext<ToastValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const [message, setMessage] = useState('');
  const [kind, setKind] = useState<Kind>('info');
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (msg: string, nextKind: Kind = 'success') => {
      setMessage(msg);
      setKind(nextKind);
      if (timer.current) clearTimeout(timer.current);
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: Platform.OS !== 'web' }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: Platform.OS !== 'web' }).start();
      }, 2400);
    },
    [opacity]
  );

  const bg = kind === 'error' ? theme.alert : kind === 'success' ? theme.success : theme.info;

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Animated.View pointerEvents="none" style={[styles.wrap, { opacity }]}>
        <View style={[styles.toast, { backgroundColor: bg }]}>
          <Text style={styles.text}>{message}</Text>
        </View>
      </Animated.View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 52,
    left: 16,
    right: 16,
    zIndex: 50,
    alignItems: 'center',
  },
  toast: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    maxWidth: 520,
    width: '100%',
  },
  text: { color: '#fff', fontWeight: '700', textAlign: 'center' },
});
