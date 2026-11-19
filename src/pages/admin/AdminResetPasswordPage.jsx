import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { updateAdminPassword } from '../../services/authService';
import { gsap, isReducedMotion } from '../../utils/gsapConfig';
import './AdminLoginPage.css';

export default function AdminResetPasswordPage() {
  const pageRef = useRef(null);
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useGSAP(() => {
    if (isReducedMotion()) return;
    gsap.fromTo('.admin-login-card',
      { y: 20, scale: 0.98, opacity: 0 },
      {
        y: 0,
        scale: 1,
        opacity: 1,
        duration: 0.65,
        ease: 'power3.out',
        clearProps: 'opacity,transform',
      }
    );
  }, { scope: pageRef });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newPassword || newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Password confirmation does not match.');
      return;
    }

    setIsSubmitting(true);
    const result = await updateAdminPassword(newPassword);
    setIsSubmitting(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/nimda-portal/dashboard');
      }, 2500);
    } else {
      setErrorMsg(result.error?.message || 'Unable to update password. Your recovery link may have expired.');
    }
  };

  return (
    <div ref={pageRef} className="admin-login-page">
      <div className="admin-login-card">
        <header className="admin-login-header">
          <div className="admin-login-logo-wrap">
            <Link to="/" aria-label="Return to website home">
              <img
                src="/Website_Logo.png"
                alt="Saifi Interior Hub"
                className="admin-login-logo-img"
                width="200"
                height="58"
              />
            </Link>
          </div>
          <h1 className="admin-login-title">Create New Password</h1>
          <p className="admin-login-subtitle">
            Please enter your new administrator password. Minimum 8 characters required.
          </p>
        </header>

        {success ? (
          <div className="admin-alert-banner alert-success" style={{ flexDirection: 'column', textAlign: 'center', padding: '1.5rem' }}>
            <CheckCircle2 size={36} style={{ margin: '0 auto 0.75rem' }} />
            <h2 style={{ fontSize: '1.2rem', marginBottom: '0.4rem', color: '#155724' }}>Password Updated Successfully</h2>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#155724' }}>
              Your new password is now active. Redirecting you to the admin portal...
            </p>
            <div style={{ marginTop: '1.25rem' }}>
              <Link to="/nimda-portal/dashboard" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                <span>Continue to Dashboard</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="admin-alert-banner alert-error" role="alert">
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="admin-login-form" noValidate>
              <div className="admin-form-group">
                <label htmlFor="new-password" className="admin-form-label">
                  New Password (min. 8 characters)
                </label>
                <div className="admin-input-wrapper">
                  <Lock size={16} className="admin-input-icon" aria-hidden="true" />
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="admin-form-input"
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="admin-password-toggle"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="admin-form-group">
                <label htmlFor="confirm-password" className="admin-form-label">
                  Confirm New Password
                </label>
                <div className="admin-input-wrapper">
                  <Lock size={16} className="admin-input-icon" aria-hidden="true" />
                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="admin-form-input"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="admin-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="admin-btn-spinner" aria-hidden="true" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Save New Password</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

