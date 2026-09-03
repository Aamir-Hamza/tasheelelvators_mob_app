import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, hydrateApiBase, setAuthToken } from '../services/api';
import { queryClient } from '../services/queryClient';
import { registerForPushNotificationsAsync } from '../services/notificationService';
import { clearAuthToken, readAuthToken, saveAuthToken } from '../services/session';
import { User } from '../services/types';

interface AuthValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, expectedRole?: User['role']) => Promise<User>;
  registerUser: (input: {
    name: string;
    email: string;
    password: string;
    phone: string;
    company?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const syncPushToken = useCallback(async () => {
    try {
      const push = await registerForPushNotificationsAsync();
      if (!push?.token) return;
      await api.post('/auth/push-token', {
        token: push.token,
        platform: push.platform,
        type: push.type,
      });
    } catch {
      // Simulator, web, missing FCM config, or denied permission.
    }
  }, []);

  const load = useCallback(async () => {
    try {
      await hydrateApiBase();
      const stored = await readAuthToken();
      if (!stored) return;
      setAuthToken(stored);
      const { data } = await api.get('/auth/me');
      setToken(stored);
      setUser(data.user);
      void syncPushToken();
    } catch {
      await clearAuthToken();
      setAuthToken(null);
    } finally {
      setLoading(false);
    }
  }, [syncPushToken]);

  useEffect(() => {
    load();
  }, [load]);

  const applySession = useCallback(
    async (sessionToken: string, nextUser: User) => {
      await saveAuthToken(sessionToken);
      setAuthToken(sessionToken);
      setToken(sessionToken);
      setUser(nextUser);
      void syncPushToken();
    },
    [syncPushToken]
  );

  const login = useCallback(
    async (email: string, password: string, expectedRole?: User['role']) => {
      const { data } = await api.post('/auth/login', { email, password });
      if (expectedRole && data.user?.role !== expectedRole) {
        const err = new Error('wrongRole') as Error & { code: string };
        err.code = 'WRONG_ROLE';
        throw err;
      }
      await applySession(data.token, data.user);
      return data.user as User;
    },
    [applySession]
  );

  const registerUser = useCallback(
    async (input: { name: string; email: string; password: string; phone: string; company?: string }) => {
      try {
        const { data } = await api.post('/auth/register-user', input);
        await applySession(data.token, data.user);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 409) {
          try {
            await login(input.email, input.password, 'customer');
            return;
          } catch {
            throw err;
          }
        }
        throw err;
      }
    },
    [applySession, login]
  );

  const logout = useCallback(async () => {
    await clearAuthToken();
    setAuthToken(null);
    setToken(null);
    setUser(null);
    queryClient.clear();
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, registerUser, logout }),
    [user, token, loading, login, registerUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
