import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { NotificationProvider } from './contexts/NotificationContext';
import LandingPage from './pages/Landing/LandingPage';
import LoginPage from './pages/Auth/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import ProjectsPage from './pages/Projects/ProjectsPage';
import ProjectDetailPage from './pages/Projects/ProjectDetailPage';
import UsersPage from './pages/Users/UsersPage';
import ActivityPage from './pages/Tasks/ActivityPage';
import { Role } from './types';

// ─── Protected Route ──────────────────────────────────────────────────────────
function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', flexDirection: 'column', gap: '1rem' }}>
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
        <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>Loading workspace...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles && user && !roles.includes(user.role as Role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// ─── App with contexts ─────────────────────────────────────────────────────────
function AppContent() {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Listen for access token changes (set by AuthContext)
  useEffect(() => {
    const handler = (e: CustomEvent) => setAccessToken(e.detail);
    window.addEventListener('auth:token', handler as EventListener);
    return () => window.removeEventListener('auth:token', handler as EventListener);
  }, []);

  return (
    <SocketProvider accessToken={accessToken}>
      <NotificationProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
          <Route path="/activity" element={<ProtectedRoute><ActivityPage /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute roles={[Role.ADMIN, Role.PROJECT_MANAGER]}><UsersPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </NotificationProvider>
    </SocketProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1)',
              fontSize: '0.875rem',
              fontWeight: 600
            },
            success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
            error: { iconTheme: { primary: '#ef4444', secondary: 'white' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
