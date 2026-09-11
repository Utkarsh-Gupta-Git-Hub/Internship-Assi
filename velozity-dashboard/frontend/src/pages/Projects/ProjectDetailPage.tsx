import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../../components/Layout/AppLayout';
import { projectsApi, tasksApi, usersApi } from '../../api';
import type { Project, Task, User } from '../../types';
import { Role, TaskStatus, Priority } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import ActivityFeed from '../../components/ActivityFeed/ActivityFeed';
import {
  Plus, ArrowLeft, Filter, Calendar, User as UserIcon,
  AlertTriangle, GripVertical,
} from 'lucide-react';
import toast from 'react-hot-toast';

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: TaskStatus.TODO,        label: 'To Do' },
  { status: TaskStatus.IN_PROGRESS, label: 'In Progress' },
  { status: TaskStatus.IN_REVIEW,   label: 'In Review' },
  { status: TaskStatus.DONE,        label: 'Done' },
];

const columnColor: Record<string, string> = {
  TODO: 'var(--color-todo)', IN_PROGRESS: 'var(--color-in-progress)',
  IN_REVIEW: 'var(--color-in-review)', DONE: 'var(--color-done)',
};

const priorityClass: Record<string, string> = {
  LOW: 'priority-low', MEDIUM: 'priority-medium', HIGH: 'priority-high', CRITICAL: 'priority-critical',
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { joinProjectRoom, leaveProjectRoom } = useSocket();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [developers, setDevelopers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | ''>('');
  const [filterPriority, setFilterPriority] = useState<Priority | ''>('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const canManage = user?.role === Role.ADMIN ||
    (user?.role === Role.PROJECT_MANAGER && project?.createdBy === user?.id);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [projRes, tasksRes] = await Promise.all([
        projectsApi.get(id),
        tasksApi.list(id, {
          ...(filterStatus ? { status: filterStatus } : {}),
          ...(filterPriority ? { priority: filterPriority } : {}),
        }),
      ]);
      setProject(projRes.data.data);
      setTasks(tasksRes.data.data);
    } catch {
      toast.error('Failed to load project');
    } finally {
      setIsLoading(false);
    }
  }, [id, filterStatus, filterPriority]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (id) {
      joinProjectRoom(id);
      return () => leaveProjectRoom(id);
    }
  }, [id, joinProjectRoom, leaveProjectRoom]);

  useEffect(() => {
    if (canManage) {
      usersApi.developers().then(r => setDevelopers(r.data.data));
    }
  }, [canManage]);

  // Reload tasks on overdue event
  useEffect(() => {
    const handler = () => load();
    window.addEventListener('task:overdue', handler);
    return () => window.removeEventListener('task:overdue', handler);
  }, [load]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (!id) return;
    try {
      const res = await tasksApi.updateStatus(id, taskId, newStatus);
      setTasks((prev) => prev.map((t) => t.id === taskId ? res.data.data : t));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Project">
        <div className="loading-overlay">
          <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout title="Project">
        <div className="loading-overlay">
          <p>Project not found or access denied.</p>
        </div>
      </AppLayout>
    );
  }

  const tasksByStatus = (status: TaskStatus) => tasks.filter((t) => t.status === status);

  return (
    <AppLayout title={project.name}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {/* Header */}
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')} style={{ marginBottom: 'var(--space-3)' }}>
            <ArrowLeft size={14} />
            Back to Projects
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="page-title">{project.name}</h2>
              <p className="text-muted">{project.client?.company} · {project.description}</p>
            </div>
            {canManage && (
              <button className="btn btn-primary" onClick={() => setShowCreateTask(true)} id="create-task">
                <Plus size={16} />
                Add Task
              </button>
            )}
          </div>
        </div>

        {/* Filters — work via query params (shareable URLs) */}
        <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
          <Filter size={14} style={{ color: 'var(--color-text-muted)' }} />
          <select
            className="form-input form-select"
            style={{ width: 'auto', padding: 'var(--space-1) var(--space-6) var(--space-1) var(--space-3)', fontSize: 'var(--text-xs)' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TaskStatus | '')}
            id="filter-status"
          >
            <option value="">All Statuses</option>
            {COLUMNS.map(c => <option key={c.status} value={c.status}>{c.label}</option>)}
          </select>
          <select
            className="form-input form-select"
            style={{ width: 'auto', padding: 'var(--space-1) var(--space-6) var(--space-1) var(--space-3)', fontSize: 'var(--text-xs)' }}
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as Priority | '')}
            id="filter-priority"
          >
            <option value="">All Priorities</option>
            {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {(filterStatus || filterPriority) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setFilterStatus(''); setFilterPriority(''); }}>
              Clear filters
            </button>
          )}
        </div>

        {/* Kanban board */}
        <div className="tasks-grid">
          {COLUMNS.map((col) => (
            <div key={col.status} className="kanban-column">
              <div className="kanban-column-header">
                <div className="flex items-center gap-2">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: columnColor[col.status], display: 'inline-block' }} />
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    {col.label}
                  </span>
                </div>
                <span className="badge badge-todo" style={{ fontSize: '10px' }}>
                  {tasksByStatus(col.status).length}
                </span>
              </div>

              {tasksByStatus(col.status).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  canManage={canManage}
                  currentUserId={user?.id}
                  columns={COLUMNS}
                  onStatusChange={(newStatus) => handleStatusChange(task.id, newStatus)}
                  onClick={() => setSelectedTask(task)}
                />
              ))}

              {tasksByStatus(col.status).length === 0 && (
                <div style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                  No tasks
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Activity Feed for this project */}
        <ActivityFeed projectId={id} />
      </div>

      {/* Modals */}
      {showCreateTask && (
        <CreateTaskModal
          projectId={id!}
          developers={developers}
          onClose={() => setShowCreateTask(false)}
          onCreate={(t) => { setTasks((prev) => [t, ...prev]); setShowCreateTask(false); }}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          projectId={id!}
          canManage={canManage}
          columns={COLUMNS}
          onClose={() => setSelectedTask(null)}
          onStatusChange={async (newStatus) => { await handleStatusChange(selectedTask.id, newStatus); setSelectedTask(null); }}
        />
      )}
    </AppLayout>
  );
}

// ─── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, canManage, currentUserId, columns, onStatusChange, onClick }: {
  task: Task;
  canManage: boolean;
  currentUserId?: string;
  columns: { status: TaskStatus; label: string }[];
  onStatusChange: (s: TaskStatus) => void;
  onClick: () => void;
}) {
  const canChangeStatus = canManage || task.assignedTo === currentUserId;

  return (
    <div className={`task-card ${priorityClass[task.priority] || ''}`} onClick={onClick}>
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-2)' }}>
        <span className={`badge badge-${task.priority.toLowerCase()}`} style={{ fontSize: '10px' }}>
          {task.priority}
        </span>
        {task.isOverdue && <span className="badge badge-overdue" style={{ fontSize: '10px' }}><AlertTriangle size={10} /> Overdue</span>}
      </div>

      <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)', lineHeight: 1.4 }}>
        {task.title}
      </p>

      {task.description && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between" style={{ marginTop: 'auto' }}>
        {task.assignee ? (
          <div className="flex items-center gap-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: 'white', fontWeight: 700 }}>
              {task.assignee.name.charAt(0)}
            </div>
            <span>{task.assignee.name.split(' ')[0]}</span>
          </div>
        ) : (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Unassigned</span>
        )}

        {task.dueDate && (
          <span style={{ fontSize: '10px', color: task.isOverdue ? 'var(--color-error)' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Calendar size={10} />
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Inline status change */}
      {canChangeStatus && (
        <select
          className="form-input form-select"
          style={{ marginTop: 'var(--space-3)', fontSize: '11px', padding: 'var(--space-1) var(--space-5) var(--space-1) var(--space-2)' }}
          value={task.status}
          onChange={(e) => { e.stopPropagation(); onStatusChange(e.target.value as TaskStatus); }}
          onClick={(e) => e.stopPropagation()}
          id={`task-status-${task.id}`}
        >
          {columns.map(c => <option key={c.status} value={c.status}>{c.label}</option>)}
        </select>
      )}
    </div>
  );
}

// ─── Create Task Modal ─────────────────────────────────────────────────────────
function CreateTaskModal({ projectId, developers, onClose, onCreate }: {
  projectId: string;
  developers: User[];
  onClose: () => void;
  onCreate: (t: Task) => void;
}) {
  const [form, setForm] = useState({
    title: '', description: '', assignedTo: '', status: TaskStatus.TODO,
    priority: Priority.MEDIUM, dueDate: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await tasksApi.create(projectId, {
        ...form,
        assignedTo: form.assignedTo || null,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      });
      toast.success('Task created!');
      onCreate(res.data.data);
    } catch {
      toast.error('Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="section-title" style={{ marginBottom: 'var(--space-6)' }}>New Task</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" required value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" id="task-title-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Task description..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input form-select" value={form.priority} onChange={(e) => setForm(f => ({ ...f, priority: e.target.value as Priority }))}>
                {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input" value={form.dueDate} onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Assign to Developer</label>
            <select className="form-input form-select" value={form.assignedTo} onChange={(e) => setForm(f => ({ ...f, assignedTo: e.target.value }))}>
              <option value="">Unassigned</option>
              {developers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3" style={{ marginTop: 'var(--space-2)' }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isLoading} id="create-task-submit">
              {isLoading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Task Detail Modal ─────────────────────────────────────────────────────────
function TaskDetailModal({ task, projectId: _projectId, canManage: _canManage, columns, onClose, onStatusChange }: {
  task: Task;
  projectId: string;
  canManage: boolean;
  columns: { status: TaskStatus; label: string }[];
  onClose: () => void;
  onStatusChange: (s: TaskStatus) => void;
}) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-6)' }}>
          <h2 className="section-title">{task.title}</h2>
          <div className="flex items-center gap-2">
            <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
            {task.isOverdue && <span className="badge badge-overdue">Overdue</span>}
          </div>
        </div>

        {task.description && (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>
            {task.description}
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div>
            <p className="form-label">Assignee</p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{task.assignee?.name || 'Unassigned'}</p>
          </div>
          <div>
            <p className="form-label">Due Date</p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
            </p>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
          <label className="form-label">Update Status</label>
          <div className="flex items-center gap-2">
            {columns.map(c => (
              <button
                key={c.status}
                className={`btn btn-sm ${task.status === c.status ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => onStatusChange(c.status)}
                id={`status-btn-${c.status}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
