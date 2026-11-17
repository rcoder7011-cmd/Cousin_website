import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { Mail, ShieldCheck, AlertCircle, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import { sendPasswordResetEmail } from '../../services/authService';
import { COMPANY_INFO } from '../../data/designer';
import { gsap, isReducedMotion } from '../../utils/gsapConfig';
import './AdminLoginPage.css';

export default function AdminForgotPasswordPage() {
  const pageRef = useRef(null);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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

    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg('Please enter a valid administrator email address.');
      return;
    }

    setIsSubmitting(true);
    const result = await sendPasswordResetEmail(cleanEmail);
    setIsSubmitting(false);

    if (result.success) {
      setSubmitted(true);
    } else {
      setErrorMsg(result.error?.message || 'Unable to process password reset request.');
    }
  };

  return (
    <div ref={pageRef} className="admin-login-page">
      <div className="admin-login-card">
        <header className="admin-login-header">
          <div className="admin-brand-badge">
            <ShieldCheck size={14} />
            <span>{COMPANY_INFO.name} Recovery</span>
          </div>
          <h1 className="admin-login-title">Reset Admin Password</h1>
          <p className="admin-login-subtitle">
            Enter your authorized admin email address to receive password reset instructions.
          </p>
        </header>

        {submitted ? (
          <div className="admin-alert-banner alert-success" style={{ flexDirection: 'column', textAlign: 'left', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <CheckCircle2 size={18} />
              <strong>Recovery Email Dispatched</strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.6 }}>
              If an authorized administrator account exists for <strong>{email}</strong>, a password reset link has been dispatched. Please check your inbox and spam folder.
            </p>
            <div style={{ marginTop: '1.25rem' }}>
              <Link to="/admin/login" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
                <ArrowLeft size={14} />
                <span>Return to Admin Login</span>
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
                <label htmlFor="recovery-email" className="admin-form-label">
                  Admin Email Address
                </label>
                <div className="admin-input-wrapper">
                  <Mail size={16} className="admin-input-icon" aria-hidden="true" />
                  <input
                    id="recovery-email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@saifiinteriorhub.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    <span>Dispatching Instructions...</span>
                  </>
                ) : (
                  <>
                    <span>Send Password Reset Link</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <footer className="admin-login-footer">
              <Link to="/admin/login" className="admin-back-link">
                <ArrowLeft size={14} />
                <span>Back to Admin Login</span>
              </Link>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

