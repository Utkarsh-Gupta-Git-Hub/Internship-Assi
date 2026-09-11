import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { CheckCheck, Bell, ExternalLink } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

interface Props {
  onClose: () => void;
}

export default function NotificationDropdown({ onClose }: Props) {
  const { notifications, unreadCount, markRead } = useNotifications();
  const navigate = useNavigate();

  const handleMarkAll = async () => {
    await markRead(undefined, true);
  };

  const handleClick = async (id: string, taskId?: string | null, projectId?: string | null) => {
    await markRead(id);
    if (taskId && projectId) {
      navigate(`/projects/${projectId}/tasks/${taskId}`);
    }
    onClose();
  };

  return (
    <div className="dropdown notif-dropdown">
      <div className="notif-header">
        <div className="flex items-center gap-2">
          <Bell size={16} />
          <span className="section-title" style={{ fontSize: 'var(--text-sm)' }}>Notifications</span>
          {unreadCount > 0 && (
            <span className="badge badge-in-progress">{unreadCount} new</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={handleMarkAll} id="mark-all-read">
            <CheckCheck size={14} />
            All read
          </button>
        )}
      </div>

      <div className="notif-list">
        {notifications.length === 0 ? (
          <div className="notif-empty">
            <Bell size={32} style={{ opacity: 0.2 }} />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              className={`notif-item ${!n.read ? 'unread' : ''}`}
              onClick={() => handleClick(n.id, n.taskId, n.task?.projectId)}
              id={`notification-${n.id}`}
            >
              <div className="notif-dot-wrapper">
                {!n.read && <span className="notif-dot" />}
              </div>
              <div className="notif-content">
                <p className="notif-title">{n.title}</p>
                <p className="notif-message">{n.message}</p>
                <p className="notif-time">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </div>
              {n.taskId && <ExternalLink size={12} style={{ opacity: 0.3, flexShrink: 0 }} />}
            </button>
          ))
        )}
      </div>

      <style>{`
        .notif-dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          width: 360px;
          max-height: 480px;
          display: flex;
          flex-direction: column;
        }

        .notif-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4);
          border-bottom: 1px solid var(--color-border);
        }

        .notif-list {
          overflow-y: auto;
          flex: 1;
        }

        .notif-item {
          width: 100%;
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          border: none;
          background: transparent;
          cursor: pointer;
          text-align: left;
          border-bottom: 1px solid var(--color-border);
          transition: background var(--transition-fast);
        }

        .notif-item:hover { background: var(--color-bg-hover); }
        .notif-item.unread { background: rgba(108, 99, 255, 0.05); }

        .notif-dot-wrapper {
          width: 8px;
          flex-shrink: 0;
          display: flex;
          padding-top: 6px;
        }

        .notif-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-primary);
          flex-shrink: 0;
        }

        .notif-content { flex: 1; min-width: 0; }

        .notif-title {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: 2px;
        }

        .notif-message {
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
          line-height: 1.5;
        }

        .notif-time {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
          margin-top: var(--space-1);
        }

        .notif-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-3);
          padding: var(--space-12);
          color: var(--color-text-muted);
          font-size: var(--text-sm);
        }
      `}</style>
    </div>
  );
}
