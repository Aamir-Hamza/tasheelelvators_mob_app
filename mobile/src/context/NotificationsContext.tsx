import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { api } from '../services/api';
import { AppNotification } from '../services/types';
import { queryClient } from '../services/queryClient';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface NotificationsValue {
  items: AppNotification[];
  unread: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const emptyNotifications: NotificationsValue = {
  items: [],
  unread: 0,
  markRead: () => undefined,
  markAllRead: () => undefined,
};

const NotificationsContext = createContext<NotificationsValue>(emptyNotifications);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const toast = useToast();
  const staff = user?.role === 'admin' || user?.role === 'technician';
  const primed = useRef(false);
  const lastId = useRef<string | null>(null);

  useEffect(() => {
    primed.current = false;
    lastId.current = null;
  }, [user?.id]);

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications')).data.data as AppNotification[],
    enabled: staff,
    refetchInterval: staff ? 4000 : false,
  });

  useEffect(() => {
    const items = query.data ?? [];
    if (!query.isSuccess) return;
    if (!primed.current) {
      primed.current = true;
      lastId.current = items[0]?._id ?? 'empty';
      return;
    }
    const newest = items[0];
    if (newest && newest._id !== lastId.current) {
      lastId.current = newest._id;
      if (!newest.read) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        toast.show(`${newest.title}\n${newest.body}`, 'info');
        void queryClient.invalidateQueries({ queryKey: ['faults'] });
        void queryClient.invalidateQueries({ queryKey: ['emergencies'] });
        void queryClient.invalidateQueries({ queryKey: ['emergency-active'] });
        void queryClient.invalidateQueries({ queryKey: ['elevators'] });
      }
    }
  }, [query.data, query.isSuccess, toast]);

  const readOne = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const readAll = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const items = query.data ?? [];
  const unread = items.filter((n) => !n.read).length;

  const value = useMemo(
    () => ({
      items,
      unread,
      markRead: (id: string) => readOne.mutate(id),
      markAllRead: () => readAll.mutate(),
    }),
    [items, unread, readOne, readAll]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
