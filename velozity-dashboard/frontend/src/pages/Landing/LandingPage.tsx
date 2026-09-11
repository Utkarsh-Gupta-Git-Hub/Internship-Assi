import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, Shield, Clock, BarChart3, Users, ArrowRight,
  CheckCircle2, Layers, Sparkles, Monitor, Key, Lock, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [activeRoleTab, setActiveRoleTab] = useState<'admin' | 'pm' | 'dev' | 'client'>('admin');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isQuickLoggingIn, setIsQuickLoggingIn] = useState(false);

  // Handle 3D tilt on mouse movement over the hero preview card
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  // Quick 1-click demo login for reviewer
  const handleQuickLogin = async (email: string) => {
    setIsQuickLoggingIn(true);
    try {
      if (email.includes('admin')) await login('admin@velozity.dev', 'Admin@123');
      else if (email.includes('pm')) await login('pm1@velozity.dev', 'PM@123456');
      else await login('dev1@velozity.dev', 'Dev@123456');
      navigate('/dashboard');
    } catch {
      navigate('/login');
    } finally {
      setIsQuickLoggingIn(false);
    }
  };

  return (
    <div style={{ background: '#f8fafc', color: '#0f172a', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* ─── Top Navigation Bar ───────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{
          maxWidth: '1280px', margin: '0 auto', padding: '0.875rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          {/* Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{
              width: 38, height: 38, borderRadius: '10px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)', color: '#fff'
            }}>
              <Zap size={22} />
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>VELOZITY</span>
              <span style={{ fontSize: '0.75rem', display: 'block', fontWeight: 600, color: '#4f46e5', marginTop: -4 }}>PROJECT INTEL</span>
            </div>
          </div>

          {/* Nav Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <a href="#features" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Features</a>
            <a href="#roles" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Role Security</a>
            <a href="#tech" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Architecture</a>
          </div>

          {/* Auth Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isAuthenticated ? (
              <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
                Open Workspace <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="btn btn-secondary">
                  Sign In
                </button>
                <button onClick={() => handleQuickLogin('admin@velozity.dev')} disabled={isQuickLoggingIn} className="btn btn-primary">
                  {isQuickLoggingIn ? 'Launching Demo...' : 'Live Demo'} <Sparkles size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', padding: '5rem 1.5rem 4rem 1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* Decorative Ambient Lighting */}
        <div style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '350px',
          background: 'radial-gradient(circle, rgba(79, 70, 229, 0.12) 0%, rgba(2, 132, 199, 0.05) 50%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0
        }} />

        <div style={{ textAlign: 'center', maxWidth: '840px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          
          {/* Glass Pill Announcement */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.375rem 1rem', borderRadius: '9999px',
              background: '#ffffff', border: '1px solid #c7d2fe',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.1)',
              fontSize: '0.8125rem', fontWeight: 600, color: '#4f46e5', marginBottom: '1.5rem'
            }}
          >
            <Sparkles size={14} color="#6366f1" /> Real-Time WebSocket & Strict Role-Based Control Platform
          </motion.div>

          {/* Hero Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', color: '#0f172a', marginBottom: '1.25rem' }}
          >
            Client Project Dashboard <br />
            <span style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #0284c7 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>Built for Real-Time Execution.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ fontSize: '1.125rem', color: '#475569', lineHeight: 1.6, marginBottom: '2rem', maxWidth: '720px', margin: '0 auto 2rem auto' }}
          >
            Engineered for high-performing agency teams. Track tasks live with Socket.io, enforce role security with granular permissions, and auto-flag overdue deliverables.
          </motion.p>

          {/* Hero CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}
          >
            <button 
              onClick={() => handleQuickLogin('admin@velozity.dev')}
              style={{
                padding: '0.875rem 2rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 700,
                background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                color: '#fff', border: 'none', boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.2s'
              }}
            >
              Launch Admin Workspace <ArrowRight size={18} />
            </button>
            <button 
              onClick={() => handleQuickLogin('pm1@velozity.dev')}
              style={{
                padding: '0.875rem 1.75rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 600,
                background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
              }}
            >
              <Users size={18} color="#4f46e5" /> Test as PM
            </button>
            <button 
              onClick={() => handleQuickLogin('dev1@velozity.dev')}
              style={{
                padding: '0.875rem 1.75rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 600,
                background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
              }}
            >
              <Monitor size={18} color="#10b981" /> Test as Developer
            </button>
          </motion.div>
        </div>

        {/* ─── 3D Perspective Motion Preview Frame ────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            marginTop: '4rem', perspective: '1200px', width: '100%', display: 'flex', justifyContent: 'center'
          }}
        >
          <div
            className="card-3d"
            style={{
              width: '100%', maxWidth: '1100px', background: '#ffffff',
              borderRadius: '20px', border: '1px solid #e2e8f0',
              boxShadow: '0 30px 60px -12px rgba(15, 23, 42, 0.12), 0 0 40px rgba(79, 70, 229, 0.08)',
              overflow: 'hidden',
              transform: `rotateX(${mousePos.y * -8}deg) rotateY(${mousePos.x * 8}deg)`,
              transition: 'transform 0.2s ease-out'
            }}
          >
            {/* Window Header */}
            <div style={{
              background: '#f8fafc', padding: '0.875rem 1.25rem', borderBottom: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748b', marginLeft: '0.75rem' }}>
                  https://app.velozity.dev/dashboard
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669' }}>Live Socket Connected</span>
              </div>
            </div>

            {/* Dashboard Mock Content */}
            <div style={{ padding: '2rem', background: '#fafafa', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
              {/* Left Main View */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Fintech Mobile App Redesign</h3>
                    <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Client: Acme Financial • 8 Tasks Active</p>
                  </div>
                  <span style={{ padding: '0.375rem 0.875rem', borderRadius: '9999px', background: '#e0e7ff', color: '#3730a3', fontSize: '0.75rem', fontWeight: 700 }}>
                    ACTIVE PROJECT
                  </span>
                </div>

                {/* Task Cards Kanban Preview */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  
                  <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', background: '#dbeafe', padding: '0.125rem 0.5rem', borderRadius: '4px' }}>
                      IN PROGRESS
                    </span>
                    <h5 style={{ fontSize: '0.875rem', fontWeight: 700, marginTop: '0.5rem', color: '#0f172a' }}>Implement OAuth2 Auth Flow</h5>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Assigned: Priya M. (PM)</p>
                  </div>

                  <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '0.125rem 0.5rem', borderRadius: '4px' }}>
                      IN REVIEW
                    </span>
                    <h5 style={{ fontSize: '0.875rem', fontWeight: 700, marginTop: '0.5rem', color: '#0f172a' }}>WebSocket Activity Stream</h5>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Assigned: Alex R. (Dev)</p>
                  </div>

                  <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #fecdd3', boxShadow: '0 2px 4px rgba(225, 29, 72, 0.05)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#be123c', background: '#ffe4e6', padding: '0.125rem 0.5rem', borderRadius: '4px' }}>
                      ⚡ OVERDUE AUTO-FLAGGED
                    </span>
                    <h5 style={{ fontSize: '0.875rem', fontWeight: 700, marginTop: '0.5rem', color: '#0f172a' }}>Stripe Webhook Integration</h5>
                    <p style={{ fontSize: '0.75rem', color: '#be123c', marginTop: '0.25rem', fontWeight: 600 }}>Cron Job Triggered</p>
                  </div>

                </div>
              </div>

              {/* Right Live Activity Feed Preview */}
              <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>Live Feed (Socket.io)</h4>
                  <span className="pulse-dot online" />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <div style={{ fontSize: '0.8125rem', borderLeft: '3px solid #4f46e5', paddingLeft: '0.75rem' }}>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>Arjun Sharma (Admin)</span> created task <span style={{ fontWeight: 600, color: '#4f46e5' }}>API Gateway Refactor</span>
                    <span style={{ fontSize: '0.6875rem', color: '#94a3b8', display: 'block', marginTop: 2 }}>Just now</span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', borderLeft: '3px solid #10b981', paddingLeft: '0.75rem' }}>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>Priya Mehta</span> changed status to <span style={{ color: '#059669', fontWeight: 700 }}>DONE</span>
                    <span style={{ fontSize: '0.6875rem', color: '#94a3b8', display: 'block', marginTop: 2 }}>2m ago</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </section>

      {/* ─── Role-Based Access Control Showcase ─────────────────────────────── */}
      <section id="roles" style={{ padding: '5rem 1.5rem', background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3rem auto' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Strict Role-Based Permission Architecture
            </h2>
            <p style={{ color: '#64748b', fontSize: '1rem', marginTop: '0.5rem' }}>
              Every endpoint and UI element enforces explicit server-side authorization checks.
            </p>
          </div>

          {/* Role Tabs Switcher */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2.5rem' }}>
            {[
              { id: 'admin', label: 'Admin Role', icon: Shield, badgeColor: '#fef3c7', textColor: '#92400e' },
              { id: 'pm', label: 'Project Manager', icon: Users, badgeColor: '#e0e7ff', textColor: '#3730a3' },
              { id: 'dev', label: 'Developer', icon: Monitor, badgeColor: '#d1fae5', textColor: '#065f46' },
            ].map((role) => {
              const Icon = role.icon;
              const isActive = activeRoleTab === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => setActiveRoleTab(role.id as any)}
                  style={{
                    padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.9375rem',
                    background: isActive ? '#0f172a' : '#f1f5f9',
                    color: isActive ? '#ffffff' : '#475569',
                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <Icon size={18} color={isActive ? '#6366f1' : '#64748b'} />
                  {role.label}
                </button>
              );
            })}
          </div>

          {/* Active Role Permissions Card */}
          <div style={{
            maxWidth: '900px', margin: '0 auto', background: '#f8fafc',
            borderRadius: '16px', border: '1px solid #e2e8f0', padding: '2rem',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.04)'
          }}>
            {activeRoleTab === 'admin' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <Shield size={28} color="#d97706" />
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Admin Role Capabilities</h3>
                    <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Full system access & administrative controls</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
                  <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <CheckCircle2 size={18} color="#10b981" style={{ marginBottom: '0.25rem' }} />
                    <h5 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Manage All Users & Roles</h5>
                    <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>Create, update, deactivate users and promote roles.</p>
                  </div>
                  <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <CheckCircle2 size={18} color="#10b981" style={{ marginBottom: '0.25rem' }} />
                    <h5 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Create Projects & Assign PMs</h5>
                    <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>Full project lifecycle and client management.</p>
                  </div>
                </div>
              </div>
            )}

            {activeRoleTab === 'pm' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <Users size={28} color="#4f46e5" />
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Project Manager Role</h3>
                    <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Project orchestration & team coordination</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
                  <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <CheckCircle2 size={18} color="#10b981" style={{ marginBottom: '0.25rem' }} />
                    <h5 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Manage Assigned Projects & Tasks</h5>
                    <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>Create tasks, assign developers, set due dates.</p>
                  </div>
                  <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <CheckCircle2 size={18} color="#10b981" style={{ marginBottom: '0.25rem' }} />
                    <h5 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Project Member Assignment</h5>
                    <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>Add or remove developers from managed projects.</p>
                  </div>
                </div>
              </div>
            )}

            {activeRoleTab === 'dev' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <Monitor size={28} color="#059669" />
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Developer Role</h3>
                    <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Focused execution & task updates</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
                  <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <CheckCircle2 size={18} color="#10b981" style={{ marginBottom: '0.25rem' }} />
                    <h5 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Update Status of Assigned Tasks</h5>
                    <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>Move assigned tasks across TODO, IN_PROGRESS, IN_REVIEW, DONE.</p>
                  </div>
                  <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <CheckCircle2 size={18} color="#10b981" style={{ marginBottom: '0.25rem' }} />
                    <h5 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Personal Feed & Notifications</h5>
                    <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>Receive real-time notifications for task updates & comments.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ─── Architectural Highlights ─────────────────────────────────────── */}
      <section id="features" style={{ padding: '5rem 1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3.5rem auto' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a' }}>
            Engineered for Production Excellence
          </h2>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
            Built with modern architecture patterns, high performance standards, and full type safety.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
          
          <div style={{
            background: '#ffffff', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)'
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '12px', background: '#e0e7ff', color: '#4f46e5',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem'
            }}>
              <Zap size={24} />
            </div>
            <h4 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>Socket.io Real-Time Engine</h4>
            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>
              Instant live activity broadcasting across all connected client sessions. Zero page refreshes needed.
            </p>
          </div>

          <div style={{
            background: '#ffffff', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)'
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '12px', background: '#d1fae5', color: '#059669',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem'
            }}>
              <Clock size={24} />
            </div>
            <h4 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>Automated Cron Overdue Job</h4>
            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>
              Node-cron service runs every 60s, querying tasks past due date, updating status to OVERDUE and pushing activity events.
            </p>
          </div>

          <div style={{
            background: '#ffffff', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)'
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '12px', background: '#fef3c7', color: '#d97706',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem'
            }}>
              <Lock size={24} />
            </div>
            <h4 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>Dual JWT Auth & Cookies</h4>
            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>
              Short-lived 15m access tokens combined with httpOnly 7d refresh token rotation for enterprise security.
            </p>
          </div>

        </div>
      </section>

      {/* ─── Footer ────────────────────────────────────────────────────────── */}
      <footer style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', padding: '2.5rem 1.5rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontWeight: 800, color: '#0f172a' }}>VELOZITY GLOBAL SOLUTIONS</span>
            <p style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              Full Stack Technical Assessment • Built with React, Node.js, Prisma, Socket.io
            </p>
          </div>
          <button onClick={() => navigate('/login')} className="btn btn-primary">
            Access Portal <ChevronRight size={16} />
          </button>
        </div>
      </footer>

    </div>
  );
}
