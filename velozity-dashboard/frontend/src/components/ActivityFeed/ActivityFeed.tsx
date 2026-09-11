import { useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, Zap } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import type { SocketActivityEvent } from '../../types';
import { TaskStatus } from '../../types';

function statusLabel(s: string): string {
  return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function getStatusColor(status?: string | null): string {
  switch (status) {
    case TaskStatus.TODO:        return 'var(--color-todo)';
    case TaskStatus.IN_PROGRESS: return 'var(--color-in-progress)';
    case TaskStatus.IN_REVIEW:   return 'var(--color-in-review)';
    case TaskStatus.DONE:        return 'var(--color-done)';
    case TaskStatus.OVERDUE:     return 'var(--color-overdue)';
    default:                     return 'var(--color-primary)';
  }
}

function ActivityItem({ event }: { event: SocketActivityEvent }) {
  const initials = event.userName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="activity-item">
      <div className="activity-avatar" style={{ background: `linear-gradient(135deg, ${getStatusColor(event.toStatus)}, ${getStatusColor(event.fromStatus)})` }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
          <strong>{event.userName}</strong>
          {' '}{event.action}{' '}
          <span style={{ color: 'var(--color-text-secondary)' }}>"{event.taskTitle}"</span>
          {event.fromStatus && event.toStatus && (
            <>
              {' '}
              <span className="badge badge-todo" style={{ fontSize: '10px' }}>
                {statusLabel(event.fromStatus)}
              </span>
              {' '}
              <ArrowRight size={10} style={{ display: 'inline', verticalAlign: 'middle' }} />
              {' '}
              <span className="badge" style={{
                fontSize: '10px',
                background: `${getStatusColor(event.toStatus)}22`,
                color: getStatusColor(event.toStatus),
              }}>
                {statusLabel(event.toStatus)}
              </span>
            </>
          )}
        </p>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
          {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

export default function ActivityFeed({ projectId }: { projectId?: string }) {
  const { activityEvents } = useSocket();
  const feedRef = useRef<HTMLDivElement>(null);

  // Filter events by role — developer only sees events for their tasks (by assignedTo)
  const filtered = activityEvents.filter((e) => {
    if (!projectId) return true; // Dashboard — show all role-scoped events
    return e.projectId === projectId;
  });

  // Auto-scroll to top (newest)
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0;
  }, [activityEvents.length]);

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <Zap size={16} style={{ color: 'var(--color-primary)' }} />
        <h3 className="section-title" style={{ fontSize: 'var(--text-sm)' }}>Live Activity Feed</h3>
        <span className="badge badge-in-progress" style={{ marginLeft: 'auto', fontSize: '10px' }}>
          {filtered.length} events
        </span>
      </div>

      <div ref={feedRef} style={{ maxHeight: '480px', overflowY: 'auto', padding: 'var(--space-1) var(--space-5)' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            <Zap size={32} style={{ margin: '0 auto var(--space-3)', opacity: 0.2 }} />
            <p>No activity yet</p>
            <p style={{ fontSize: 'var(--text-xs)' }}>Events will appear here in real time</p>
          </div>
        ) : (
          filtered.map((event) => (
            <ActivityItem key={event.id} event={event} />
          ))
        )}
      </div>
    </div>
  );
}
