import React, {
  createContext, useContext, useEffect, useRef, useState,
  useCallback, type ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import type { SocketActivityEvent, Notification } from '../types';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  onlineCount: number;
  activityEvents: SocketActivityEvent[];
  latestNotification: Notification | null;
  joinProjectRoom: (projectId: string) => void;
  leaveProjectRoom: (projectId: string) => void;
  clearActivity: () => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children, accessToken }: { children: ReactNode; accessToken: string | null }) {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [activityEvents, setActivityEvents] = useState<SocketActivityEvent[]>([]);
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);

  useEffect(() => {
    if (!user || !accessToken) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    // Connect with JWT in handshake — same auth as HTTP requests
    const socket = io('/', {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket] Connected:', socket.id);

      // Fetch missed events since last session
      const lastSeen = localStorage.getItem('lastSeen') || new Date(Date.now() - 3600000).toISOString();
      socket.emit('missed:events', { since: lastSeen });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      localStorage.setItem('lastSeen', new Date().toISOString());
    });

    socket.on('activity:new', (event: SocketActivityEvent) => {
      setActivityEvents((prev) => [event, ...prev.slice(0, 99)]); // Keep last 100
    });

    socket.on('missed:events:response', (events: SocketActivityEvent[]) => {
      if (events.length > 0) {
        setActivityEvents((prev) => {
          const existingIds = new Set(prev.map((e) => e.id));
          const newEvents = events.filter((e) => !existingIds.has(e.id));
          return [...newEvents, ...prev].slice(0, 100);
        });
      }
    });

    socket.on('notification:new', (notification: Notification) => {
      setLatestNotification(notification);
    });

    socket.on('presence:count', ({ count }: { count: number }) => {
      setOnlineCount(count);
    });

    socket.on('task:overdue', () => {
      // Trigger a re-fetch in consuming components
      window.dispatchEvent(new CustomEvent('task:overdue'));
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [user, accessToken]);

  const joinProjectRoom = useCallback((projectId: string) => {
    socketRef.current?.emit('join:project', projectId);
  }, []);

  const leaveProjectRoom = useCallback((projectId: string) => {
    socketRef.current?.emit('leave:project', projectId);
  }, []);

  const clearActivity = useCallback(() => {
    setActivityEvents([]);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        onlineCount,
        activityEvents,
        latestNotification,
        joinProjectRoom,
        leaveProjectRoom,
        clearActivity,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
