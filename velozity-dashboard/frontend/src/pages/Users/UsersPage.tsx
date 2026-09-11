import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/Layout/AppLayout';
import { usersApi } from '../../api';
import type { User } from '../../types';
import { Role } from '../../types';
import { Plus, Trash2, Edit2, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const roleBadge: Record<string, string> = {
  ADMIN: 'badge-critical', PROJECT_MANAGER: 'badge-in-review', DEVELOPER: 'badge-in-progress',
};

const roleLabel: Record<string, string> = {
  ADMIN: 'Administrator', PROJECT_MANAGER: 'Project Manager', DEVELOPER: 'Developer',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    usersApi.list({ limit: 50 })
      .then(r => setUsers(r.data.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete user "${name}"? This is irreversible.`)) return;
    try {
      await usersApi.delete(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success('User deleted');
    } catch {
      toast.error('Failed to delete user');
    }
  };

  return (
    <AppLayout title="Team Management">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="page-title">Team Members</h2>
            <p className="text-muted">{users.length} users</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)} id="create-user">
            <Plus size={16} />
            Add User
          </button>
        </div>

        {isLoading ? (
          <div className="loading-overlay"><div className="spinner" style={{ width: 32, height: 32 }} /></div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Member since</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: 'var(--text-sm)', flexShrink: 0 }}>
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>{u.name}</p>
                          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge ${roleBadge[u.role] || 'badge-todo'}`}>{roleLabel[u.role]}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: u.isOnline ? 'var(--color-success)' : 'var(--color-text-muted)', display: 'inline-block' }} />
                        <span style={{ fontSize: 'var(--text-xs)', color: u.isOnline ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                          {u.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleDelete(u.id, u.name)}
                          title="Delete user"
                          id={`delete-user-${u.id}`}
                        >
                          <Trash2 size={14} style={{ color: 'var(--color-error)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreate={(u) => { setUsers((prev) => [u, ...prev]); setShowCreate(false); }}
        />
      )}

      <style>{`
        .users-table {
          width: 100%;
          border-collapse: collapse;
        }
        .users-table th {
          padding: var(--space-3) var(--space-5);
          text-align: left;
          font-size: var(--text-xs);
          font-weight: 600;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--color-border);
        }
        .users-table td {
          padding: var(--space-4) var(--space-5);
          border-bottom: 1px solid var(--color-border);
        }
        .users-table tr:last-child td { border-bottom: none; }
        .users-table tr:hover td { background: var(--color-bg-elevated); }
      `}</style>
    </AppLayout>
  );
}

function CreateUserModal({ onClose, onCreate }: { onClose: () => void; onCreate: (u: User) => void }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: Role.DEVELOPER });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await usersApi.create(form);
      toast.success('User created!');
      onCreate(res.data.data);
    } catch {
      toast.error('Failed to create user. Email may already exist.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="section-title" style={{ marginBottom: 'var(--space-6)' }}>Add Team Member</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" required value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ananya Gupta" />
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input type="email" className="form-input" required value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="ananya@velozity.dev" />
          </div>
          <div className="form-group">
            <label className="form-label">Password *</label>
            <input type="password" className="form-input" required value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 8 characters" minLength={8} />
          </div>
          <div className="form-group">
            <label className="form-label">Role *</label>
            <select className="form-input form-select" value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value as Role }))}>
              {Object.values(Role).map(r => <option key={r} value={r}>{roleLabel[r]}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3" style={{ marginTop: 'var(--space-2)' }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isLoading} id="create-user-submit">
              {isLoading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
