import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/Layout/AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import { Role, type AdminStats, type PMStats, type DevStats, type Task, TaskStatus, Priority } from '../../types';
import { projectsApi } from '../../api';
import ActivityFeed from '../../components/ActivityFeed/ActivityFeed';
import { useSocket } from '../../contexts/SocketContext';
import {
  FolderKanban, CheckCircle2, AlertTriangle, Users,
  Clock, TrendingUp, Star, Flame,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  TODO: '#64748b', IN_PROGRESS: '#2563eb', IN_REVIEW: '#d97706', DONE: '#059669', OVERDUE: '#dc2626',
};
const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#64748b', MEDIUM: '#2563eb', HIGH: '#d97706', CRITICAL: '#dc2626',
};

function PriorityIcon({ p }: { p: string }) {
  if (p === Priority.CRITICAL) return <Flame size={14} style={{ color: '#dc2626' }} />;
  if (p === Priority.HIGH)     return <Star  size={14} style={{ color: '#d97706' }} />;
  return null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { onlineCount } = useSocket();
  const [stats, setStats] = useState<AdminStats | PMStats | DevStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await projectsApi.dashboardStats();
        setStats(res.data.data);
      } catch {
        // handle error
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return (
      <AppLayout title="Dashboard">
        <div className="loading-overlay">
          <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <p>Loading workspace statistics...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dashboard">
      {/* Admin Dashboard */}
      {user?.role === Role.ADMIN && stats && (
        <AdminDashboard stats={stats as AdminStats} onlineCount={onlineCount} />
      )}

      {/* PM Dashboard */}
      {user?.role === Role.PROJECT_MANAGER && stats && (
        <PMDashboard stats={stats as PMStats} />
      )}

      {/* Developer Dashboard */}
      {user?.role === Role.DEVELOPER && stats && (
        <DevDashboard stats={stats as DevStats} />
      )}
    </AppLayout>
  );
}

// ─── Admin Dashboard ───────────────────────────────────────────────────────────
function AdminDashboard({ stats, onlineCount }: { stats: AdminStats; onlineCount: number }) {
  const statusData = stats.tasksByStatus.map((s) => ({
    name: s.status.replace('_', ' '),
    value: s._count.status,
    color: STATUS_COLORS[s.status] || '#4f46e5',
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 className="page-title">Global Agency Overview</h2>
        <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Real-time metrics across all active projects, tasks, and team members
        </p>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <div className="stat-value">{stats.totalProjects}</div>
            <div className="stat-label">Total Projects</div>
          </div>
          <div className="stat-icon" style={{ color: '#4f46e5' }}>
            <FolderKanban size={26} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#dc2626' }}>{stats.overdueCount}</div>
            <div className="stat-label">Overdue Tasks</div>
          </div>
          <div className="stat-icon" style={{ color: '#dc2626', background: '#ffe4e6' }}>
            <AlertTriangle size={26} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#059669' }}>
              {stats.tasksByStatus.find(s => s.status === 'DONE')?._count.status ?? 0}
            </div>
            <div className="stat-label">Completed Tasks</div>
          </div>
          <div className="stat-icon" style={{ color: '#059669', background: '#d1fae5' }}>
            <CheckCircle2 size={26} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#0284c7' }}>{onlineCount}</div>
            <div className="stat-label">Users Online</div>
          </div>
          <div className="stat-icon" style={{ color: '#0284c7', background: '#e0f2fe' }}>
            <Users size={26} />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 className="section-title" style={{ marginBottom: '1.25rem' }}>Tasks by Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusData} barSize={36}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', color: '#0f172a' }}
                cursor={{ fill: 'rgba(79,70,229,0.05)' }}
              />
              {statusData.map((d) => (
                <Bar key={d.name} dataKey="value" name={d.name} fill={d.color} radius={[6, 6, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="section-title" style={{ marginBottom: '1.25rem' }}>Status Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={true}>
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', color: '#0f172a' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Live Activity Stream */}
      <ActivityFeed />
    </div>
  );
}

// ─── PM Dashboard ─────────────────────────────────────────────────────────────
function PMDashboard({ stats }: { stats: PMStats }) {
  const priorityData = stats.tasksByPriority.map((p) => ({
    name: p.priority,
    value: p._count.priority,
    color: PRIORITY_COLORS[p.priority] || '#4f46e5',
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 className="page-title">Project Manager Overview</h2>
        <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Monitor team deliverables, priority tasks, and upcoming due dates
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <div className="stat-value">{stats.myProjects}</div>
            <div className="stat-label">Managed Projects</div>
          </div>
          <div className="stat-icon" style={{ color: '#4f46e5' }}><FolderKanban size={26} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#d97706' }}>{stats.upcomingTasks.length}</div>
            <div className="stat-label">Due This Week</div>
          </div>
          <div className="stat-icon" style={{ color: '#d97706', background: '#fef3c7' }}><Clock size={26} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#dc2626' }}>
              {stats.tasksByPriority.find(p => p.priority === 'CRITICAL')?._count.priority ?? 0}
            </div>
            <div className="stat-label">Critical Tasks</div>
          </div>
          <div className="stat-icon" style={{ color: '#dc2626', background: '#ffe4e6' }}><AlertTriangle size={26} /></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 className="section-title" style={{ marginBottom: '1.25rem' }}>Tasks by Priority</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priorityData} barSize={36}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, color: '#0f172a' }} />
              {priorityData.map((d) => (
                <Bar key={d.name} dataKey="value" name={d.name} fill={d.color} radius={[6, 6, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="section-title" style={{ marginBottom: '1.25rem' }}>Due This Week</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {stats.upcomingTasks.length === 0 ? (
              <p className="text-muted" style={{ padding: '1rem', textAlign: 'center' }}>No tasks due this week 🎉</p>
            ) : (
              stats.upcomingTasks.map((t: Task) => (
                <div key={t.id} className="upcoming-task-row">
                  <PriorityIcon p={t.priority} />
                  <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>{t.title}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ActivityFeed />
    </div>
  );
}

// ─── Developer Dashboard ───────────────────────────────────────────────────────
function DevDashboard({ stats }: { stats: DevStats }) {
  const tasks = stats.myTasks;

  const statusBadgeClass: Record<string, string> = {
    TODO: 'badge-todo', IN_PROGRESS: 'badge-in-progress', IN_REVIEW: 'badge-in-review',
    DONE: 'badge-done', OVERDUE: 'badge-overdue',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 className="page-title">My Workstation</h2>
        <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Your assigned tasks, sorted by priority and due date
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <div className="stat-value">{tasks.length}</div>
            <div className="stat-label">Assigned Tasks</div>
          </div>
          <div className="stat-icon" style={{ color: '#4f46e5' }}><CheckCircle2 size={26} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#2563eb' }}>
              {tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length}
            </div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-icon" style={{ color: '#2563eb', background: '#dbeafe' }}><TrendingUp size={26} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#d97706' }}>
              {tasks.filter(t => t.status === TaskStatus.IN_REVIEW).length}
            </div>
            <div className="stat-label">In Review</div>
          </div>
          <div className="stat-icon" style={{ color: '#d97706', background: '#fef3c7' }}><Star size={26} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#dc2626' }}>
              {tasks.filter(t => t.isOverdue).length}
            </div>
            <div className="stat-label">Overdue</div>
          </div>
          <div className="stat-icon" style={{ color: '#dc2626', background: '#ffe4e6' }}><AlertTriangle size={26} /></div>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title" style={{ marginBottom: '1.25rem' }}>Assigned Task Queue</h3>
        {tasks.length === 0 ? (
          <p className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>No tasks assigned to you right now.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {tasks.map((t: Task) => (
              <div key={t.id} className="dev-task-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                  <PriorityIcon p={t.priority} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.title}
                  </span>
                  {t.isOverdue && <span className="badge badge-overdue" style={{ fontSize: '10px' }}>OVERDUE</span>}
                </div>
                <span className={`badge ${statusBadgeClass[t.status] || 'badge-todo'}`} style={{ fontSize: '10px' }}>
                  {t.status.replace('_', ' ')}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>
                  {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No due date'}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {t.project?.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <ActivityFeed />
    </div>
  );
}
