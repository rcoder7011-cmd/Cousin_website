import React, { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import {
  LogOut,
  ExternalLink,
  FolderKanban,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { COMPANY_INFO } from '../../data/designer';
import { gsap, isReducedMotion } from '../../utils/gsapConfig';
import './AdminDashboardPage.css';

export default function AdminDashboardPage() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const pageRef = useRef(null);

  useGSAP(() => {
    if (isReducedMotion()) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.from('.admin-welcome-banner', {
      y: 20,
      opacity: 0,
      duration: 0.65,
    });

    tl.from('.admin-module-card', {
      y: 24,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
    }, '-=0.3');

    tl.from('.admin-security-note', {
      y: 16,
      opacity: 0,
      duration: 0.5,
    }, '-=0.2');

  }, { scope: pageRef });

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const adminName = profile?.full_name || 'Studio Administrator';
  const adminEmail = user?.email || 'admin@saifiinteriorhub.in';

  return (
    <div ref={pageRef} className="admin-dashboard-page">
      {/* Top Administration Bar */}
      <header className="admin-top-navbar">
        <div className="container admin-top-inner">
          <div className="admin-brand-lockup">
            <span className="admin-portal-name">{COMPANY_INFO.name}</span>
            <span className="admin-portal-tag">Admin Management Portal</span>
          </div>

          <div className="admin-nav-actions">
            <Link
              to="/"
              className="btn btn-outline admin-header-btn"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View public website in new tab"
            >
              <ExternalLink size={14} />
              <span>View Website</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-outline admin-header-btn"
              aria-label="Sign out from admin portal"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="container admin-dashboard-body">
        {/* Welcome Banner */}
        <section className="admin-welcome-banner" aria-label="Welcome banner">
          <div>
            <h1 className="admin-welcome-title">Welcome, {adminName}</h1>
            <p className="admin-welcome-desc">
              Your session is securely authenticated and authorized via Supabase Database Row Level Security.
            </p>
          </div>

          <div className="admin-profile-pill">
            <div className="admin-avatar-icon" aria-hidden="true">
              <UserCheck size={20} />
            </div>
            <div>
              <div className="admin-pill-name">{adminName}</div>
              <div className="admin-pill-role">Role: {profile?.role || 'admin'} • {adminEmail}</div>
            </div>
          </div>
        </section>

        {/* Future CRUD Modules Overview (Roadmap to Part 7) */}
        <section aria-label="Management tools overview">
          <div className="admin-modules-grid">
            {/* Module 1: Projects Management */}
            <div className="admin-module-card">
              <div className="admin-module-icon-wrap" aria-hidden="true">
                <FolderKanban size={22} />
              </div>
              <h2 className="admin-module-title">Projects Management</h2>
              <p className="admin-module-desc">
                Publish, edit, and organize turnkey residential & commercial projects with slugs, completion dates, and featured flags.
              </p>
              <div className="admin-module-status">
                <Clock size={13} />
                <span>Ready for CRUD in Part 7</span>
              </div>
            </div>

            {/* Module 2: Category Management */}
            <div className="admin-module-card">
              <div className="admin-module-icon-wrap" aria-hidden="true">
                <Layers size={22} />
              </div>
              <h2 className="admin-module-title">Categories Management</h2>
              <p className="admin-module-desc">
                Manage room classifications (Bedroom, Kitchen, Living Room, POP Ceiling, Wardrobe, Office) and custom display order.
              </p>
              <div className="admin-module-status">
                <Clock size={13} />
                <span>Ready for CRUD in Part 7</span>
              </div>
            </div>

            {/* Module 3: Supabase Storage & Media */}
            <div className="admin-module-card">
              <div className="admin-module-icon-wrap" aria-hidden="true">
                <ImageIcon size={22} />
              </div>
              <h2 className="admin-module-title">Storage & Media Assets</h2>
              <p className="admin-module-desc">
                Direct uploads to the <code>project-images</code> bucket with automatic project-folder categorization and 10MB limits.
              </p>
              <div className="admin-module-status">
                <Clock size={13} />
                <span>Ready for CRUD in Part 7</span>
              </div>
            </div>
          </div>
        </section>

        {/* Security Verification Callout */}
        <section className="admin-security-note" aria-label="Security status">
          <CheckCircle2 size={22} className="security-note-icon" aria-hidden="true" />
          <div>
            <h2 className="security-note-title">Authentication & Security Verification Status</h2>
            <p className="security-note-text">
              Private admin routes under <code>/admin/*</code> are protected by <code>AdminRouteGuard</code> in the client and backed by PostgreSQL Row Level Security (RLS) on all tables (<code>categories</code>, <code>projects</code>, <code>project_images</code>, <code>site_settings</code>). Public visitors have read-only access to published projects, and unverified users are strictly blocked from write operations.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
