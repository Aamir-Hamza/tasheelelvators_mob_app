import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api, setAuthToken } from '../services/api';
import { queryClient } from '../services/queryClient';
import { User } from '../services/types';

interface AuthValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | undefined>(undefined);
const TOKEN_KEY = 'tasheel.token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const stored = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!stored) return;
      setAuthToken(stored);
      const { data } = await api.get('/auth/me');
      setToken(stored);
      setUser(data.user);
    } catch {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setAuthToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    setAuthToken(data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setAuthToken(null);
    setToken(null);
    setUser(null);
    queryClient.clear();
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, logout }),
    [user, token, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
