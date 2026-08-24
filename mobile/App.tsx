import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { I18nProvider } from './src/context/I18nContext';
import { ToastProvider } from './src/context/ToastContext';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { queryClient } from './src/services/queryClient';

function ThemedApp() {
  const { theme, mode } = useTheme();
  const navTheme = {
    ...(mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(mode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.bg,
      card: theme.card,
      text: theme.text,
      border: theme.border,
      primary: theme.accent,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <I18nProvider>
            <ToastProvider>
              <AuthProvider>
                <ThemedApp />
              </AuthProvider>
            </ToastProvider>
          </I18nProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
