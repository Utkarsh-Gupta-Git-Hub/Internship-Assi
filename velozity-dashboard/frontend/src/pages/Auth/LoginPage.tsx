import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Zap, Eye, EyeOff, ArrowRight, ArrowLeft, Shield, Users, Monitor } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      toast.error('Invalid email or password credentials');
    } finally {
      setIsLoading(false);
    }
  };

  // Instant 1-click execution for demo role buttons
  const quickLogin = async (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    setIsLoading(true);
    try {
      await login(e, p);
      navigate('/dashboard');
    } catch {
      toast.error('Quick login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f8fafc', padding: '1.5rem', position: 'relative'
    }}>
      
      {/* Background Accent Gradients */}
      <div style={{
        position: 'absolute', top: '10%', left: '15%', width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(79, 70, 229, 0.08) 0%, transparent 70%)',
        filter: 'blur(50px)', pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>
        
        {/* Back link */}
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.875rem',
            fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            cursor: 'pointer', marginBottom: '1.5rem'
          }}
        >
          <ArrowLeft size={16} /> Back to Landing Page
        </button>

        {/* Brand Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 52, height: 52, borderRadius: '14px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem auto', boxShadow: '0 8px 20px rgba(79, 70, 229, 0.25)', color: '#ffffff'
          }}>
            <Zap size={28} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Velozity Workspace
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
            Real-Time Client Project Dashboard
          </p>
        </div>

        {/* Form Card */}
        <div style={{
          background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px',
          padding: '2rem', boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.08)'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="admin@velozity.dev"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer'
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
              disabled={isLoading}
              id="login-submit"
            >
              {isLoading ? (
                <span className="spinner" style={{ width: 18, height: 18 }} />
              ) : (
                <>Sign in to Dashboard <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Quick Demo Login Preset Buttons (Instant 1-click execution) */}
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
            <p style={{
              fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8',
              textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', marginBottom: '0.875rem'
            }}>
              Instant 1-Click Role Login
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => quickLogin('admin@velozity.dev', 'Admin@123')}
                disabled={isLoading}
                style={{
                  padding: '0.625rem 0.25rem', borderRadius: '8px', background: '#fef3c7', border: '1px solid #fde68a',
                  color: '#92400e', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem'
                }}
              >
                <Shield size={14} /> Admin
              </button>
              <button
                type="button"
                onClick={() => quickLogin('pm1@velozity.dev', 'PM@123456')}
                disabled={isLoading}
                style={{
                  padding: '0.625rem 0.25rem', borderRadius: '8px', background: '#e0e7ff', border: '1px solid #c7d2fe',
                  color: '#3730a3', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem'
                }}
              >
                <Users size={14} /> PM 1
              </button>
              <button
                type="button"
                onClick={() => quickLogin('dev1@velozity.dev', 'Dev@123456')}
                disabled={isLoading}
                style={{
                  padding: '0.625rem 0.25rem', borderRadius: '8px', background: '#d1fae5', border: '1px solid #a7f3d0',
                  color: '#065f46', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem'
                }}
              >
                <Monitor size={14} /> Dev 1
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
