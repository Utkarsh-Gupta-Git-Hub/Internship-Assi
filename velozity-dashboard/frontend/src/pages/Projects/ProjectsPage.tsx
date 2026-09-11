import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../components/Layout/AppLayout';
import { projectsApi, clientsApi } from '../../api';
import type { Project, Client } from '../../types';
import { Role, ProjectStatus } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import {
  Plus, Folder, Users, CheckSquare, Calendar, MoreVertical, Search,
} from 'lucide-react';
import toast from 'react-hot-toast';

const statusBadge: Record<string, string> = {
  ACTIVE: 'badge-in-progress', ON_HOLD: 'badge-in-review', COMPLETED: 'badge-done', ARCHIVED: 'badge-todo',
};

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  const canCreate = user?.role === Role.ADMIN || user?.role === Role.PROJECT_MANAGER;

  useEffect(() => {
    const load = async () => {
      try {
        const [projRes] = await Promise.all([
          projectsApi.list(),
          ...(canCreate ? [clientsApi.list().then(r => setClients(r.data.data))] : []),
        ]);
        setProjects(projRes.data.data);
      } catch {
        toast.error('Failed to load projects');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [canCreate]);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.client?.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout title="Projects">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="page-title">Projects</h2>
            <p className="text-muted">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="search-box">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
                id="project-search"
              />
            </div>
            {canCreate && (
              <button className="btn btn-primary" onClick={() => setShowCreate(true)} id="create-project">
                <Plus size={16} />
                New Project
              </button>
            )}
          </div>
        </div>

        {/* Projects grid */}
        {isLoading ? (
          <div className="projects-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 200 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="loading-overlay">
            <Folder size={48} style={{ opacity: 0.2 }} />
            <p>{search ? 'No projects match your search' : 'No projects yet'}</p>
          </div>
        ) : (
          <div className="projects-grid">
            {filtered.map((p) => (
              <ProjectCard key={p.id} project={p} onDeleted={() => setProjects((prev) => prev.filter(x => x.id !== p.id))} />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateProjectModal
          clients={clients}
          onClose={() => setShowCreate(false)}
          onCreate={(p) => { setProjects((prev) => [p, ...prev]); setShowCreate(false); }}
        />
      )}

      <style>{`
        .search-box {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border-strong);
          border-radius: var(--radius-md);
          padding: var(--space-2) var(--space-3);
          color: var(--color-text-secondary);
        }
        .search-input {
          background: transparent;
          border: none;
          outline: none;
          color: var(--color-text-primary);
          font-size: var(--text-sm);
          width: 180px;
        }
        .search-input::placeholder { color: var(--color-text-muted); }

        .project-card-meta {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          margin-top: var(--space-4);
          padding-top: var(--space-4);
          border-top: 1px solid var(--color-border);
        }
        .project-meta-item {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          font-size: var(--text-xs);
          color: var(--color-text-muted);
        }

        .dev-task-row, .upcoming-task-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-sm);
          background: var(--color-bg-elevated);
          border: 1px solid var(--color-border);
        }
      `}</style>
    </AppLayout>
  );
}

function ProjectCard({ project, onDeleted }: { project: Project; onDeleted: () => void }) {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const canManage =
    user?.role === Role.ADMIN ||
    (user?.role === Role.PROJECT_MANAGER && project.createdBy === user.id);

  const handleDelete = async () => {
    if (!confirm(`Delete "${project.name}"? This is irreversible.`)) return;
    try {
      await projectsApi.delete(project.id);
      toast.success('Project deleted');
      onDeleted();
    } catch {
      toast.error('Failed to delete project');
    }
  };

  return (
    <div className="card project-card" style={{ position: 'relative' }}>
      {/* Status + menu */}
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-3)' }}>
        <span className={`badge ${statusBadge[project.status] || 'badge-todo'}`}>
          {project.status.replace('_', ' ')}
        </span>
        {canManage && (
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-ghost btn-sm"
              style={{ padding: 'var(--space-1)', border: 'none' }}
              onClick={(e) => { e.preventDefault(); setShowMenu(v => !v); }}
            >
              <MoreVertical size={14} />
            </button>
            {showMenu && (
              <div className="dropdown" style={{ right: 0, top: '100%', width: 140 }}>
                <Link
                  to={`/projects/${project.id}`}
                  className="dropdown-item"
                  onClick={() => setShowMenu(false)}
                >Edit</Link>
                <button className="dropdown-item danger" onClick={handleDelete}>Delete</button>
              </div>
            )}
          </div>
        )}
      </div>

      <Link to={`/projects/${project.id}`} style={{ display: 'block' }}>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>
          {project.name}
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }} className="truncate">
          {project.client?.company}
        </p>
        {project.description && (
          <p className="text-muted" style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {project.description}
          </p>
        )}

        <div className="project-card-meta">
          <span className="project-meta-item">
            <CheckSquare size={12} />
            {project._count?.tasks ?? 0} tasks
          </span>
          <span className="project-meta-item">
            <Users size={12} />
            {project._count?.members ?? 0} members
          </span>
          <span className="project-meta-item">
            <Calendar size={12} />
            {new Date(project.createdAt).toLocaleDateString()}
          </span>
        </div>
      </Link>

      <style>{`
        .dropdown-item {
          display: block;
          width: 100%;
          padding: var(--space-2) var(--space-4);
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          background: transparent;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: all var(--transition-fast);
          font-family: inherit;
        }
        .dropdown-item:hover { background: var(--color-bg-hover); color: var(--color-text-primary); }
        .dropdown-item.danger:hover { background: rgba(239,68,68,0.1); color: var(--color-error); }
      `}</style>
    </div>
  );
}

function CreateProjectModal({ clients, onClose, onCreate }: {
  clients: Client[];
  onClose: () => void;
  onCreate: (p: Project) => void;
}) {
  const [form, setForm] = useState({ name: '', description: '', clientId: '', status: ProjectStatus.ACTIVE });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId) { toast.error('Please select a client'); return; }
    setIsLoading(true);
    try {
      const res = await projectsApi.create(form);
      toast.success('Project created!');
      onCreate(res.data.data);
    } catch {
      toast.error('Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="section-title" style={{ marginBottom: 'var(--space-6)' }}>New Project</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input className="form-input" required value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. FinEdge Dashboard Revamp" />
          </div>
          <div className="form-group">
            <label className="form-label">Client *</label>
            <select className="form-input form-select" required value={form.clientId} onChange={(e) => setForm(f => ({ ...f, clientId: e.target.value }))}>
              <option value="">Select a client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.company} — {c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Project description..." />
          </div>
          <div className="flex items-center gap-3" style={{ marginTop: 'var(--space-2)' }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isLoading} id="create-project-submit">
              {isLoading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
