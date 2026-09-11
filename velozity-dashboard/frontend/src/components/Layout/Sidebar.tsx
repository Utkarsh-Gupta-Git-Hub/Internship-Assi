import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Folder, Users,
  LogOut, ChevronRight, Zap, Activity,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  roles?: Role[];
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/projects',  icon: <Folder size={18} />,           label: 'Projects' },
  { to: '/activity',  icon: <Activity size={18} />,         label: 'Activity Feed' },
  { to: '/users',     icon: <Users size={18} />,             label: 'Team Members', roles: [Role.ADMIN, Role.PROJECT_MANAGER] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    navigate('/login');
  };

  const filteredNav = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role as Role))
  );

  const roleLabel: Record<string, string> = {
    ADMIN: 'Administrator',
    PROJECT_MANAGER: 'Project Manager',
    DEVELOPER: 'Developer',
  };

  const roleBadgeClass: Record<string, string> = {
    ADMIN: 'badge-role-admin',
    PROJECT_MANAGER: 'badge-role-pm',
    DEVELOPER: 'badge-role-dev',
  };

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, bottom: 0,
      width: 'var(--sidebar-width)', background: '#ffffff',
      borderRight: '1px solid #e2e8f0', display: 'flex',
      flexDirection: 'column', zIndex: 50, padding: '1.25rem 1rem'
    }}>
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', marginBottom: '1.75rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
        <div style={{
          width: 38, height: 38, borderRadius: '10px',
          background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#ffffff', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
        }}>
          <Zap size={22} />
        </div>
        <div>
          <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>VELOZITY</span>
          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#4f46e5', display: 'block', marginTop: -3 }}>
            WORKSPACE
          </span>
        </div>
      </div>

      {/* Nav Section */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: 1 }}>
        {filteredNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.625rem 0.875rem', borderRadius: '10px',
              fontSize: '0.875rem', fontWeight: isActive ? 700 : 600,
              color: isActive ? '#4f46e5' : '#475569',
              background: isActive ? '#e0e7ff' : 'transparent',
              transition: 'all 0.15s ease'
            })}
          >
            {item.icon}
            <span>{item.label}</span>
            <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.4 }} />
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.875rem 0.5rem 0.25rem 0.5rem', borderTop: '1px solid #e2e8f0', marginTop: 'auto'
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%', background: '#4f46e5',
          color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '0.875rem', flexShrink: 0
        }}>
          {user?.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.name}
          </div>
          <span className={`badge ${user?.role ? roleBadgeClass[user.role] : ''}`} style={{ marginTop: 2, padding: '0.125rem 0.375rem', fontSize: '0.6875rem' }}>
            {user?.role ? roleLabel[user.role] : ''}
          </span>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          title="Sign Out"
          style={{
            background: 'transparent', border: 'none', color: '#94a3b8',
            padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', flexShrink: 0
          }}
        >
          <LogOut size={18} />
        </button>
      </div>

    </aside>
  );
}
