import React, {
  createContext, useContext, useState, useCallback, useEffect, type ReactNode,
} from 'react';
import type { Notification } from '../types';
import { notificationsApi } from '../api';
import { useSocket } from './SocketContext';

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markRead: (id?: string, all?: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { latestNotification } = useSocket();

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await notificationsApi.list({ limit: 20 });
      setNotifications(response.data.data);
      setUnreadCount(response.data.meta?.unreadCount ?? 0);
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Real-time notification via WebSocket — update count without polling
  useEffect(() => {
    if (latestNotification) {
      setNotifications((prev) => [latestNotification, ...prev.slice(0, 19)]);
      setUnreadCount((prev) => prev + 1);
    }
  }, [latestNotification]);

  const markRead = useCallback(async (id?: string, all?: boolean) => {
    await notificationsApi.markRead(id, all);
    if (all) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } else if (id) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, isLoading, markRead, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
