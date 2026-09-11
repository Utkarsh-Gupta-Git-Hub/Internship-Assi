import React, { useState, useRef, useEffect } from 'react';
import { Bell, Wifi, WifiOff } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationDropdown from '../Notifications/NotificationDropdown';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';

interface TopbarProps {
  title: string;
}

export default function Topbar({ title }: TopbarProps) {
  const { isConnected, onlineCount } = useSocket();
  const { unreadCount } = useNotifications();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.closest('.notif-wrapper')?.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="topbar">
      <h1 className="topbar-title">{title}</h1>

      <div className="topbar-right">
        {/* Online count — Admin only */}
        {user?.role === Role.ADMIN && (
          <div className="topbar-online">
            <span className="online-dot" />
            <span className="topbar-online-text">{onlineCount} online</span>
          </div>
        )}

        {/* Connection status */}
        <div className={`topbar-ws-status ${isConnected ? 'connected' : 'disconnected'}`} title={isConnected ? 'Real-time connected' : 'Reconnecting...'}>
          {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
        </div>

        {/* Notification bell */}
        <div className="notif-wrapper relative">
          <button
            ref={bellRef}
            className="topbar-icon-btn"
            onClick={() => setShowNotifications((v) => !v)}
            id="notification-bell"
            aria-label={`${unreadCount} unread notifications`}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <NotificationDropdown onClose={() => setShowNotifications(false)} />
          )}
        </div>
      </div>

      <style>{`
        .topbar {
          position: fixed;
          top: 0;
          left: var(--sidebar-width);
          right: 0;
          height: var(--topbar-height);
          background: var(--color-bg-surface);
          border-bottom: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--space-8);
          z-index: 40;
          backdrop-filter: blur(12px);
        }

        .topbar-title {
          font-size: var(--text-lg);
          font-weight: 600;
          color: var(--color-text-primary);
          letter-spacing: -0.01em;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .topbar-online {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          padding: var(--space-1) var(--space-3);
          border-radius: var(--radius-full);
        }

        .topbar-online-text {
          font-size: var(--text-xs);
          font-weight: 600;
          color: var(--color-success);
        }

        .topbar-ws-status {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          font-size: var(--text-xs);
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
        }

        .topbar-ws-status.connected {
          color: var(--color-success);
          background: rgba(16, 185, 129, 0.1);
        }
        .topbar-ws-status.disconnected {
          color: var(--color-warning);
          background: rgba(245, 158, 11, 0.1);
        }

        .topbar-icon-btn {
          position: relative;
          background: transparent;
          border: 1px solid var(--color-border);
          color: var(--color-text-secondary);
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }
        .topbar-icon-btn:hover {
          background: var(--color-bg-hover);
          color: var(--color-text-primary);
          border-color: var(--color-border-strong);
        }
      `}</style>
    </header>
  );
}
