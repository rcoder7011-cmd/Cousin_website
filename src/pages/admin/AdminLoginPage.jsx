import React, { useState, useRef } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { COMPANY_INFO } from '../../data/designer';
import { BACKEND_CONFIG } from '../../config/backendConfig';
import { gsap, isReducedMotion } from '../../utils/gsapConfig';
import './AdminLoginPage.css';

export default function AdminLoginPage() {
  const { login, user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pageRef = useRef(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  // If already logged in as authorized admin, redirect immediately
  const destination = location.state?.from?.pathname || '/admin/dashboard';

  // GSAP subtle entrance animation
  useGSAP(() => {
    if (isReducedMotion()) return;

    gsap.fromTo('.admin-login-card',
      { y: 24, scale: 0.98, opacity: 0 },
      {
        y: 0,
        scale: 1,
        opacity: 1,
        duration: 0.7,
        ease: 'power3.out',
        clearProps: 'opacity,transform',
      }
    );
  }, { scope: pageRef });

  if (!isLoading && user && isAdmin) {
    return <Navigate to={destination} replace />;
  }

  const validate = () => {
    const errors = {};
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!validate()) return;

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      navigate(destination, { replace: true });
    } else {
      setGeneralError(result.error?.message || 'Login failed. Please verify your credentials.');
    }
  };

  return (
    <div ref={pageRef} className="admin-login-page">
      <div className="admin-login-card">
        {/* Header / Brand */}
        <header className="admin-login-header">
          <div className="admin-brand-badge">
            <ShieldCheck size={14} />
            <span>{COMPANY_INFO.name} Administration</span>
          </div>
          <h1 className="admin-login-title">Studio Portal Login</h1>
          <p className="admin-login-subtitle">
            Private management portal for authorized studio administrators ({COMPANY_INFO.domain}).
          </p>
        </header>

        {/* Demo Mode Notification & Autofill */}
        {BACKEND_CONFIG.isDemoMode && (
          <div
            className="admin-demo-mode-banner"
            style={{
              background: 'rgba(217, 119, 6, 0.08)',
              border: '1px solid rgba(217, 119, 6, 0.25)',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '20px',
              fontSize: '0.84rem',
              color: 'var(--color-text-secondary, #666)',
              lineHeight: 1.5
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d97706', display: 'inline-block' }} />
                Demo Mode Active
              </span>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@saifiinteriorhub.in');
                  setPassword('DemoAdmin#2026');
                  setFormErrors({});
                  setGeneralError('');
                }}
                style={{
                  background: 'none',
                  border: '1px solid rgba(217, 119, 6, 0.4)',
                  borderRadius: '4px',
                  color: '#d97706',
                  fontSize: '0.75rem',
                  padding: '3px 8px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Autofill Demo Admin
              </button>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#777' }}>
              Supabase credentials are not connected. Sign in with any credentials or click Autofill to explore the administrative portal in local demo mode.
            </p>
          </div>
        )}

        {/* Error Alert Banner */}
        {generalError && (
          <div className="admin-alert-banner alert-error" role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{generalError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="admin-login-form" noValidate>
          {/* Email Field */}
          <div className="admin-form-group">
            <label htmlFor="admin-email" className="admin-form-label">
              Admin Email Address
            </label>
            <div className="admin-input-wrapper">
              <Mail size={16} className="admin-input-icon" aria-hidden="true" />
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                placeholder="admin@saifiinteriorhub.in"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (generalError) setGeneralError('');
                }}
                className={`admin-form-input ${formErrors.email ? 'has-error' : ''}`}
                disabled={isSubmitting}
                required
              />
            </div>
            {formErrors.email && (
              <span className="admin-field-error" role="alert">{formErrors.email}</span>
            )}
          </div>

          {/* Password Field */}
          <div className="admin-form-group">
            <label htmlFor="admin-password" className="admin-form-label">
              Password
            </label>
            <div className="admin-input-wrapper">
              <Lock size={16} className="admin-input-icon" aria-hidden="true" />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (generalError) setGeneralError('');
                }}
                className={`admin-form-input ${formErrors.password ? 'has-error' : ''}`}
                disabled={isSubmitting}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="admin-password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={0}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {formErrors.password && (
              <span className="admin-field-error" role="alert">{formErrors.password}</span>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="admin-form-options">
            <Link to="/admin/forgot-password" className="admin-forgot-link">
              Forgot your password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="admin-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="admin-btn-spinner" aria-hidden="true" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Back Link */}
        <footer className="admin-login-footer">
          <Link to="/" className="admin-back-link">
            <ArrowLeft size={14} />
            <span>Return to {COMPANY_INFO.domain}</span>
          </Link>
        </footer>
      </div>
    </div>
  );
}
