import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import {
  FolderKanban,
  CheckCircle2,
  FileEdit,
  Layers,
  Star,
  PlusCircle,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Inbox,
  Sparkles,
  MapPin,
  Calendar,
  Edit3
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { COMPANY_INFO } from '../../data/designer';
import { getDashboardStats, getRecentProjectsAdmin } from '../../services/adminService';
import { gsap, isReducedMotion } from '../../utils/gsapConfig';
import './AdminDashboardOverview.css';

export default function AdminDashboardOverview() {
  const { user, profile } = useAuth();
  const containerRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [stats, setStats] = useState({
    totalProjects: 0,
    publishedProjects: 0,
    draftProjects: 0,
    totalCategories: 0,
    featuredProjects: 0
  });
  const [recentProjects, setRecentProjects] = useState([]);

  // Fetch real database metrics and recent projects
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [statsRes, projectsRes] = await Promise.all([
          getDashboardStats(),
          getRecentProjectsAdmin({ limit: 6 })
        ]);

        if (!isMounted) return;

        if (statsRes.error && !statsRes.data) {
          throw statsRes.error;
        }

        setStats(statsRes.data);
        setRecentProjects(projectsRes.data || []);
        setLoadError(null);
      } catch (err) {
        if (!isMounted) return;
        console.error('[AdminDashboardOverview] Error loading data:', err);
        setLoadError(err.message || 'Failed to load dashboard metrics. Please check your Supabase connection.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [reloadTrigger]);

  // Event handler for user-initiated refresh
  const handleRefresh = () => {
    setIsLoading(true);
    setLoadError(null);
    setReloadTrigger(prev => prev + 1);
  };

  // Entrance animations using GSAP
  useGSAP(() => {
    if (isReducedMotion() || isLoading) return;

    const ctx = gsap.timeline({ defaults: { ease: 'power3.out' } });

    ctx.from('.admin-hero-card', {
      y: 20,
      opacity: 0,
      duration: 0.5
    });

    ctx.from('.stat-card', {
      y: 25,
      opacity: 0,
      duration: 0.45,
      stagger: 0.08
    }, '-=0.2');

    ctx.from('.action-tile-btn', {
      y: 18,
      opacity: 0,
      duration: 0.4,
      stagger: 0.06
    }, '-=0.25');

    ctx.from('.admin-table-card', {
      y: 20,
      opacity: 0,
      duration: 0.5
    }, '-=0.2');

  }, { scope: containerRef, dependencies: [isLoading] });

  const adminName = profile?.full_name || user?.email?.split('@')[0] || 'Studio Administrator';
  const adminEmail = user?.email || 'admin@saifiinteriorhub.in';

  return (
    <div ref={containerRef} className="admin-overview-container">
      {/* 1. WELCOME HERO SECTION */}
      <section className="admin-hero-card" aria-label="Welcome section">
        <div className="hero-text-group">
          <div className="hero-welcome-badge">
            <Sparkles size={13} />
            <span>Saifi Interior Hub • 10+ Years Experience</span>
          </div>
          <h1 className="hero-welcome-title">Welcome, {adminName}</h1>
          <p className="hero-welcome-desc">
            Manage your interior design portfolio, projects, categories and website content from one centralized studio administration workspace.
          </p>
        </div>

        <div className="hero-admin-meta">
          <div className="hero-avatar-box" aria-hidden="true">
            <Sparkles size={20} />
          </div>
          <div className="hero-admin-details">
            <span className="hero-admin-name">{adminName}</span>
            <span className="hero-admin-subline">{adminEmail}</span>
          </div>
        </div>
      </section>

      {/* ERROR CALLOUT WITH RETRY */}
      {loadError && (
        <div className="admin-error-banner" role="alert" style={{
          background: 'rgba(220, 53, 69, 0.08)',
          border: '1px solid rgba(220, 53, 69, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={20} color="#dc3545" />
            <span style={{ fontSize: '0.9rem', color: '#dc3545', fontWeight: 500 }}>
              {loadError}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.9rem',
              background: '#dc3545',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={13} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 2. STATISTIC CARDS (5 Real Database Metrics) */}
      <section aria-label="Database metrics and statistics">
        <div className="admin-stats-grid">
          {/* Card 1: Total Projects */}
          <div className="stat-card">
            <div className="stat-card-top">
              <span className="stat-card-title">Total Projects</span>
              <div className="stat-card-icon-wrap stat-icon-gold">
                <FolderKanban size={18} />
              </div>
            </div>
            {isLoading ? (
              <div className="stat-card-skeleton skeleton-shimmer" style={{ height: '36px', width: '50%' }} />
            ) : (
              <div className="stat-card-value">{stats.totalProjects}</div>
            )}
            <span className="stat-card-caption">All registered works</span>
          </div>

          {/* Card 2: Published Projects */}
          <div className="stat-card">
            <div className="stat-card-top">
              <span className="stat-card-title">Published</span>
              <div className="stat-card-icon-wrap stat-icon-green">
                <CheckCircle2 size={18} />
              </div>
            </div>
            {isLoading ? (
              <div className="stat-card-skeleton skeleton-shimmer" style={{ height: '36px', width: '50%' }} />
            ) : (
              <div className="stat-card-value">{stats.publishedProjects}</div>
            )}
            <span className="stat-card-caption">Live on public website</span>
          </div>

          {/* Card 3: Draft Projects */}
          <div className="stat-card">
            <div className="stat-card-top">
              <span className="stat-card-title">Drafts</span>
              <div className="stat-card-icon-wrap stat-icon-amber">
                <FileEdit size={18} />
              </div>
            </div>
            {isLoading ? (
              <div className="stat-card-skeleton skeleton-shimmer" style={{ height: '36px', width: '50%' }} />
            ) : (
              <div className="stat-card-value">{stats.draftProjects}</div>
            )}
            <span className="stat-card-caption">Pending publication</span>
          </div>

          {/* Card 4: Total Categories */}
          <div className="stat-card">
            <div className="stat-card-top">
              <span className="stat-card-title">Categories</span>
              <div className="stat-card-icon-wrap stat-icon-blue">
                <Layers size={18} />
              </div>
            </div>
            {isLoading ? (
              <div className="stat-card-skeleton skeleton-shimmer" style={{ height: '36px', width: '50%' }} />
            ) : (
              <div className="stat-card-value">{stats.totalCategories}</div>
            )}
            <span className="stat-card-caption">Room classifications</span>
          </div>

          {/* Card 5: Featured Projects */}
          <div className="stat-card">
            <div className="stat-card-top">
              <span className="stat-card-title">Featured</span>
              <div className="stat-card-icon-wrap stat-icon-purple">
                <Star size={18} />
              </div>
            </div>
            {isLoading ? (
              <div className="stat-card-skeleton skeleton-shimmer" style={{ height: '36px', width: '50%' }} />
            ) : (
              <div className="stat-card-value">{stats.featuredProjects}</div>
            )}
            <span className="stat-card-caption">Highlighted on homepage</span>
          </div>
        </div>
      </section>

      {/* 3. QUICK ACTIONS GRID */}
      <section aria-label="Studio quick actions">
        <h2 className="admin-section-title">Quick Studio Actions</h2>
        <div className="admin-actions-grid">
          <Link to="/admin/projects/new" className="action-tile-btn">
            <div className="action-tile-icon">
              <PlusCircle size={22} />
            </div>
            <div className="action-tile-content">
              <span className="action-tile-title">Add New Project</span>
              <span className="action-tile-desc">Upload photos & details</span>
              <span className="action-tile-badge">Active</span>
            </div>
            <ArrowRight size={16} color="var(--color-text-light)" />
          </Link>

          <Link to="/admin/projects" className="action-tile-btn">
            <div className="action-tile-icon">
              <FolderKanban size={22} />
            </div>
            <div className="action-tile-content">
              <span className="action-tile-title">Manage Projects</span>
              <span className="action-tile-desc">Edit, filter & publish works</span>
              <span className="action-tile-badge">Active</span>
            </div>
            <ArrowRight size={16} color="var(--color-text-light)" />
          </Link>

          <Link to="/admin/categories" className="action-tile-btn">
            <div className="action-tile-icon">
              <Layers size={22} />
            </div>
            <div className="action-tile-content">
              <span className="action-tile-title">Manage Categories</span>
              <span className="action-tile-desc">Bedrooms, Kitchens, POP</span>
              <span className="action-tile-badge">Part 8 Ready</span>
            </div>
            <ArrowRight size={16} color="var(--color-text-light)" />
          </Link>

          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="action-tile-btn"
          >
            <div className="action-tile-icon">
              <ExternalLink size={22} />
            </div>
            <div className="action-tile-content">
              <span className="action-tile-title">View Live Website</span>
              <span className="action-tile-desc">{COMPANY_INFO.website}</span>
              <span className="action-tile-badge">Public Site</span>
            </div>
            <ExternalLink size={16} color="var(--color-text-light)" />
          </Link>
        </div>
      </section>

      {/* 4. RECENT PROJECTS DATA TABLE */}
      <section className="admin-table-card" aria-label="Recent projects table">
        <div className="admin-table-header">
          <div className="table-header-left">
            <h2 className="table-main-title">Recent Studio Projects</h2>
            <p className="table-sub-title">
              Latest interior design deliverables logged in the portfolio
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleRefresh}
              className="btn btn-outline"
              style={{
                fontSize: '0.78rem',
                padding: '0.45rem 0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderColor: 'var(--admin-border)',
                color: 'var(--admin-primary)',
                background: '#ffffff'
              }}
              title="Refresh project list"
              disabled={isLoading}
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <Link
              to="/admin/projects"
              className="btn btn-primary"
              style={{
                fontSize: '0.78rem',
                padding: '0.45rem 0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <span>View All Projects</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        <div className="table-responsive-wrapper">
          {isLoading ? (
            <div style={{ padding: '2rem' }}>
              <div className="stat-card-skeleton skeleton-shimmer" style={{ height: '40px', marginBottom: '1rem' }} />
              <div className="stat-card-skeleton skeleton-shimmer" style={{ height: '40px', marginBottom: '1rem' }} />
              <div className="stat-card-skeleton skeleton-shimmer" style={{ height: '40px', marginBottom: '1rem' }} />
              <div className="stat-card-skeleton skeleton-shimmer" style={{ height: '40px' }} />
            </div>
          ) : recentProjects.length === 0 ? (
            <div className="table-empty-box">
              <Inbox size={42} className="empty-box-icon" />
              <h3 className="empty-box-title">No Projects Found</h3>
              <p className="empty-box-text">
                Your portfolio currently has no projects logged in the database. When you add projects in Part 8, they will appear here.
              </p>
            </div>
          ) : (
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th scope="col" style={{ width: '38%' }}>Project Details</th>
                  <th scope="col">Category</th>
                  <th scope="col">Location</th>
                  <th scope="col">Date / Status</th>
                  <th scope="col">Featured</th>
                  <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentProjects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <div className="table-project-cell">
                        <img
                          src={project.coverImage}
                          alt=""
                          className="table-project-thumb"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = '/projects/project-1.jpg';
                          }}
                        />
                        <div>
                          <Link
                            to={`/projects/${project.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="table-project-title-link"
                            title="View public details page"
                          >
                            {project.title}
                          </Link>
                          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)' }}>
                            ID: {project.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="table-category-tag">
                        {project.category}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                        <MapPin size={13} color="var(--admin-accent)" />
                        <span>{project.location}</span>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                          <Calendar size={12} />
                          <span>{project.projectDate}</span>
                        </div>
                        <span className={`status-badge ${project.isPublished ? 'published' : 'draft'}`}>
                          {project.isPublished ? '● Published' : '○ Draft'}
                        </span>
                      </div>
                    </td>

                    <td>
                      {project.isFeatured ? (
                        <span className="featured-pill">
                          <Star size={11} fill="var(--admin-accent)" />
                          <span>Featured</span>
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>—</span>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <Link
                          to={`/projects/${project.slug}?preview=true`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline"
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.3rem 0.65rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            borderColor: 'var(--admin-border)',
                            color: 'var(--admin-primary)',
                            background: '#ffffff'
                          }}
                        >
                          <ExternalLink size={12} />
                          <span>Preview</span>
                        </Link>

                        <Link
                          to={`/admin/projects/${project.id}/edit`}
                          className="btn btn-outline"
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.3rem 0.65rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            borderColor: 'var(--admin-border)',
                            color: 'var(--admin-primary)',
                            background: '#ffffff'
                          }}
                        >
                          <Edit3 size={12} />
                          <span>Edit</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}