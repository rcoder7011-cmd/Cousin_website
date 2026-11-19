import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { COMPANY_INFO } from '../../data/designer';
import './AdminRouteGuard.css';

/**
 * Higher-order Route Guard for protecting /nimda-portal/* routes.
 *
 * Rules:
 * 1. While authentication/authorization is verifying: Displays loading spinner (no content flash).
 * 2. If unauthenticated: Redirects to /nimda-portal/login preserving redirect destination.
 * 3. If authenticated but NOT authorized in admin_profiles: Renders Access Denied view.
 * 4. If authenticated AND authorized in admin_profiles: Renders protected children.
 */
export default function AdminRouteGuard({ children }) {
  const { user, isAdmin, isLoading, logout } = useAuth();
  const location = useLocation();

  // 1. Loading state (Prevents protected UI flashing)
  if (isLoading) {
    return (
      <div className="admin-guard-loading" role="status" aria-live="polite">
        <div className="guard-loading-card">
          <div className="guard-spinner" aria-hidden="true" />
          <h2 className="guard-loading-title">Verifying Administrator Access</h2>
          <p className="guard-loading-text">
            Checking credentials for {COMPANY_INFO.name} management portal...
          </p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: Redirect to obfuscated admin login route
  if (!user) {
    return <Navigate to="/nimda-portal/login" state={{ from: location }} replace />;
  }

  // 3. Authenticated but NOT authorized in admin_profiles
  if (!isAdmin) {
    return (
      <div className="admin-access-denied-view" role="alert">
        <div className="access-denied-card">
          <div className="access-denied-logo-wrap" style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <img
              src="/Website_Logo.png"
              alt="Saifi Interior Hub"
              style={{ maxHeight: '48px', width: 'auto', margin: '0 auto', display: 'block', objectFit: 'contain' }}
            />
          </div>
          <div className="access-denied-icon" aria-hidden="true">
            <ShieldAlert size={34} />
          </div>
          <h1 className="access-denied-title">Access Denied (403)</h1>
          <p className="access-denied-message">
            Your account is authenticated, but you have not been granted administrator privileges for <strong>{COMPANY_INFO.name}</strong>. Only authorized administrators registered in the studio's database can access this area.
          </p>
          <div className="access-denied-user-box">
            Signed in as: <strong>{user.email}</strong>
          </div>
          <div className="access-denied-actions">
            <button
              type="button"
              onClick={() => logout()}
              className="btn btn-outline"
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
            <Link to="/" className="btn btn-primary">
              <ArrowLeft size={15} />
              <span>Return to Public Website</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized administrator: Render protected route content
  return children;
}
