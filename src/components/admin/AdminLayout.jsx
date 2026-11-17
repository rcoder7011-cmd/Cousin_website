import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Layers,
  Image as ImageIcon,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { COMPANY_INFO } from '../../data/designer';
import './AdminLayout.css';

export default function AdminLayout({ children, pageTitle = 'Dashboard Overview' }) {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(location.pathname);

  // Close mobile nav on route change by adjusting state during render
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname);
    setMobileNavOpen(false);
  }

  // Handle Escape key and body scroll lock
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileNavOpen) {
        setMobileNavOpen(false);
      }
    };
    if (mobileNavOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileNavOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const adminName = profile?.full_name || user?.email?.split('@')[0] || 'Administrator';
  const initial = (adminName[0] || 'A').toUpperCase();

  const navItems = [
    {
      to: '/admin/dashboard',
      alias: '/admin',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      to: '/admin/projects',
      label: 'Projects',
      icon: FolderKanban,
      badge: null
    },
    {
      to: '/admin/categories',
      label: 'Categories',
      icon: Layers,
      badge: null
    },
    {
      to: '/admin/media',
      label: 'Media Library',
      icon: ImageIcon,
      badge: null
    },
    {
      to: '/admin/settings',
      label: 'Website Settings',
      icon: Settings,
      badge: 'Part 8'
    }
  ];

  return (
    <div className="admin-layout-root">
      {/* Mobile Drawer Backdrop */}
      <div
        className={`admin-sidebar-backdrop ${mobileNavOpen ? 'is-visible' : ''}`}
        onClick={() => setMobileNavOpen(false)}
        aria-hidden="true"
      />

      {/* 1. SIDEBAR NAVIGATION */}
      <aside
        id="admin-sidebar-drawer"
        className={`admin-sidebar ${mobileNavOpen ? 'is-open' : ''}`}
        aria-label="Admin Navigation Sidebar"
      >
        <div className="admin-sidebar-header">
          <Link to="/admin/dashboard" className="admin-sidebar-brand" onClick={() => setMobileNavOpen(false)}>
            <span className="admin-brand-title">{COMPANY_INFO.name}</span>
            <span className="admin-brand-tagline">Studio Administration</span>
          </Link>
          <button
            type="button"
            className="admin-sidebar-close-btn"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close admin menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Dashboard views">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || (item.alias && location.pathname === item.alias);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`admin-nav-item ${isActive ? 'is-active' : ''}`}
                onClick={() => setMobileNavOpen(false)}
              >
                <Icon size={18} className="admin-nav-icon" aria-hidden="true" />
                <span>{item.label}</span>
                {item.badge && <span className="admin-nav-badge">{item.badge}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <Link
            to="/"
            className="admin-nav-item"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View live public website (opens in new tab)"
          >
            <ExternalLink size={17} className="admin-nav-icon" aria-hidden="true" />
            <span>View Website</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="admin-nav-item admin-logout-btn"
            aria-label="Sign out of administrative session"
          >
            <LogOut size={17} className="admin-nav-icon" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE WRAPPER */}
      <div className="admin-main-wrapper">
        {/* Top Header */}
        <header className="admin-top-header">
          <div className="header-left-group">
            <button
              type="button"
              className="mobile-sidebar-toggle"
              onClick={() => setMobileNavOpen(prev => !prev)}
              aria-label="Toggle navigation drawer"
              aria-expanded={mobileNavOpen}
              aria-controls="admin-sidebar-drawer"
            >
              <Menu size={20} />
            </button>

            <nav className="admin-page-breadcrumbs" aria-label="Admin breadcrumbs">
              <Link to="/admin/dashboard" className="admin-breadcrumb-home">Admin</Link>
              <ChevronRight size={13} aria-hidden="true" />
              <span className="admin-breadcrumb-current">{pageTitle}</span>
            </nav>
          </div>

          <div className="header-right-group">
            <Link
              to="/"
              className="header-public-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={14} />
              <span>Public Site</span>
            </Link>

            <div className="header-admin-pill" title={`Signed in as ${user?.email || adminName}`}>
              <div className="header-avatar-circle" aria-hidden="true">
                {initial}
              </div>
              <div className="header-admin-info">
                <span className="header-admin-name">{adminName}</span>
                <span className="header-admin-role">Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Shell */}
        <main className="admin-content-shell">
          {children}
        </main>
      </div>
    </div>
  );
}
