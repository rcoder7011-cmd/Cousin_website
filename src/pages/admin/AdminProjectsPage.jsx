import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import {
  Plus,
  Search,
  Star,
  Eye,
  Edit3,
  Trash2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  RotateCcw,
  Clock
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  getAdminProjects,
  toggleProjectPublish,
  toggleProjectFeatured,
  deleteProjectFull
} from '../../services/projectService';
import { getCategories } from '../../services/categoryService';
import { gsap, isReducedMotion } from '../../utils/gsapConfig';
import './AdminProjectsPage.css';

export default function AdminProjectsPage() {
  const containerRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters & Pagination State
  const categoryParam = searchParams.get('category') || searchParams.get('category_id') || 'all';
  const [prevCategoryParam, setPrevCategoryParam] = useState(categoryParam);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState(categoryParam);
  const [status, setStatus] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [page, setPage] = useState(1);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Sync categoryId during render when searchParams change
  if (prevCategoryParam !== categoryParam) {
    setPrevCategoryParam(categoryParam);
    setCategoryId(categoryParam);
    setPage(1);
  }

  // Data State
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Stats Counters
  const [metrics, setMetrics] = useState({
    total: 0,
    published: 0,
    drafts: 0,
    featured: 0
  });

  // Action / Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  // Toast timer helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3800);
  };

  // 1. Load category list for filter dropdown (including inactive categories for complete admin visibility)
  useEffect(() => {
    let isMounted = true;
    async function loadCats() {
      const { data } = await getCategories({ includeInactive: true });
      if (isMounted && Array.isArray(data)) {
        setCategories(data);
      }
    }
    loadCats();
    return () => { isMounted = false; };
  }, []);

  // 2. Fetch projects from Supabase based on filters & pagination
  useEffect(() => {
    let isMounted = true;

    async function fetchList() {
      try {
        const { data, count, totalPages: tPages, error } = await getAdminProjects({
          search,
          categoryId,
          status,
          sortBy,
          page,
          limit: 10
        });

        if (!isMounted) return;

        if (error && !data) {
          throw error;
        }

        setProjects(data || []);
        setTotalCount(count || 0);
        setTotalPages(tPages || 1);
        setFetchError(null);

        // Calculate summary counts if status is all and no search
        if (status === 'all' && !search && categoryId === 'all') {
          const pub = (data || []).filter(p => p.is_published).length;
          const feat = (data || []).filter(p => p.is_featured).length;
          setMetrics({
            total: count || (data ? data.length : 0),
            published: pub,
            drafts: Math.max(0, (count || 0) - pub),
            featured: feat
          });
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('[AdminProjectsPage] Error loading projects:', err);
        setFetchError(err.message || 'Unable to retrieve projects from database.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchList();
    return () => { isMounted = false; };
  }, [search, categoryId, status, sortBy, page, reloadTrigger]);

  // Entrance animations
  useGSAP(() => {
    if (isReducedMotion() || isLoading) return;

    gsap.fromTo('.projects-header-card, .projects-summary-strip, .projects-toolbar',
      { y: 18, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.45,
        stagger: 0.08,
        ease: 'power3.out',
        clearProps: 'opacity,transform',
      }
    );
  }, { scope: containerRef, dependencies: [isLoading] });

  // Handle Quick Publish Toggle
  const handleTogglePublish = async (project) => {
    const nextStatus = !project.is_published;

    // Optimistic UI update
    setProjects(prev =>
      prev.map(p => p.id === project.id ? { ...p, is_published: nextStatus } : p)
    );

    const { error } = await toggleProjectPublish(project.id, nextStatus);

    if (error) {
      showToast(`Failed to update publication status: ${error.message}`, 'error');
      // Rollback
      setProjects(prev =>
        prev.map(p => p.id === project.id ? { ...p, is_published: !nextStatus } : p)
      );
    } else {
      showToast(
        nextStatus
          ? `"${project.title}" is now published on the live website.`
          : `"${project.title}" was moved to drafts.`
      );
    }
  };

  // Handle Quick Featured Toggle
  const handleToggleFeatured = async (project) => {
    const nextFeatured = !project.is_featured;

    // Optimistic UI update
    setProjects(prev =>
      prev.map(p => p.id === project.id ? { ...p, is_featured: nextFeatured } : p)
    );

    const { error } = await toggleProjectFeatured(project.id, nextFeatured);

    if (error) {
      showToast(`Failed to update featured highlight: ${error.message}`, 'error');
      // Rollback
      setProjects(prev =>
        prev.map(p => p.id === project.id ? { ...p, is_featured: !nextFeatured } : p)
      );
    } else {
      showToast(
        nextFeatured
          ? `Marked "${project.title}" as featured portfolio work.`
          : `Removed "${project.title}" from featured highlights.`
      );
    }
  };

  // Handle Project Deletion
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    const { success, error } = await deleteProjectFull(deleteTarget.id);

    setIsDeleting(false);
    if (!success || error) {
      showToast(error?.message || 'Failed to delete project.', 'error');
    } else {
      showToast(`"${deleteTarget.title}" was permanently deleted.`);
      setDeleteTarget(null);
      // Refresh list
      setIsLoading(true);
      setReloadTrigger(prev => prev + 1);
    }
  };

  // Handle category filter change with URL search param synchronization
  const handleCategoryChange = (newCatId) => {
    setCategoryId(newCatId);
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (newCatId === 'all') {
      newParams.delete('category');
      newParams.delete('category_id');
    } else {
      newParams.set('category', newCatId);
    }
    setSearchParams(newParams, { replace: true });
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setCategoryId('all');
    setStatus('all');
    setSortBy('latest');
    setPage(1);
    setIsLoading(true);
    setSearchParams({}, { replace: true });
    setReloadTrigger(prev => prev + 1);
  };

  const isFiltered = search || categoryId !== 'all' || status !== 'all' || sortBy !== 'latest';

  return (
    <AdminLayout pageTitle="Project Management">
      <div ref={containerRef} className="admin-projects-container">
        {/* 1. TOP HEADER CARD */}
        <section className="projects-header-card" aria-label="Projects management header">
          <div>
            <h1 className="projects-header-title">Project Management</h1>
            <p className="projects-header-sub">
              Manage your interior design portfolio and showcase your latest turnkey work.
            </p>
          </div>

          <Link to="/nimda-portal/projects/new" className="add-project-btn">
            <Plus size={18} />
            <span>Add New Project</span>
          </Link>
        </section>

        {/* 2. STATS SUMMARY STRIP */}
        <section className="projects-summary-strip" aria-label="Projects summary counts">
          <div className="summary-pill-card">
            <span className="summary-pill-label">Total Works</span>
            <span className="summary-pill-num">{totalCount}</span>
          </div>
          <div className="summary-pill-card">
            <span className="summary-pill-label">Published</span>
            <span className="summary-pill-num" style={{ color: '#28a745' }}>
              {status === 'all' && !search ? metrics.published : projects.filter(p => p.is_published).length}
            </span>
          </div>
          <div className="summary-pill-card">
            <span className="summary-pill-label">Drafts</span>
            <span className="summary-pill-num" style={{ color: '#fd7e14' }}>
              {status === 'all' && !search ? metrics.drafts : projects.filter(p => !p.is_published).length}
            </span>
          </div>
          <div className="summary-pill-card">
            <span className="summary-pill-label">Featured</span>
            <span className="summary-pill-num" style={{ color: 'var(--admin-accent)' }}>
              {status === 'all' && !search ? metrics.featured : projects.filter(p => p.is_featured).length}
            </span>
          </div>
        </section>

        {/* 3. TOOLBAR: SEARCH, FILTERS & SORT */}
        <section className="projects-toolbar" aria-label="Search and filter toolbar">
          <div className="toolbar-search-box">
            <Search size={16} className="toolbar-search-icon" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by title, location, slug..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="toolbar-search-input"
              aria-label="Search projects"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '0.6rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-light)'
                }}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="toolbar-filters-group">
            {/* Category Filter */}
            <select
              value={categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="toolbar-select"
              aria-label="Filter by category"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} {!cat.is_active ? '(Inactive)' : ''}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="toolbar-select"
              aria-label="Filter by publication status"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published Only</option>
              <option value="draft">Drafts Only</option>
              <option value="featured">Featured Only</option>
            </select>

            {/* Sorting */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="toolbar-select"
              aria-label="Sort projects"
            >
              <option value="latest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="alphabetical">Alphabetical (A-Z)</option>
              <option value="order">Display Order</option>
            </select>

            {/* Reset Button */}
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="toolbar-reset-btn"
                title="Reset all filters"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </section>

        {/* 4. ERROR CALLOUT */}
        {fetchError && (
          <div role="alert" style={{
            background: 'rgba(220, 53, 69, 0.08)',
            border: '1px solid rgba(220, 53, 69, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <AlertCircle size={18} color="#dc3545" />
              <span style={{ fontSize: '0.88rem', color: '#dc3545', fontWeight: 500 }}>
                {fetchError}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                setReloadTrigger(prev => prev + 1);
              }}
              className="btn btn-outline"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
            >
              <RefreshCw size={12} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* 5. DATA TABLE CARD */}
        <section className="projects-table-card" aria-label="Projects list table">
          <div className="projects-table-scroll">
            {isLoading ? (
              <div style={{ padding: '2rem' }}>
                <div className="skeleton-shimmer" style={{ height: '48px', marginBottom: '0.75rem' }} />
                <div className="skeleton-shimmer" style={{ height: '48px', marginBottom: '0.75rem' }} />
                <div className="skeleton-shimmer" style={{ height: '48px', marginBottom: '0.75rem' }} />
                <div className="skeleton-shimmer" style={{ height: '48px' }} />
              </div>
            ) : projects.length === 0 ? (
              <div style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
                <AlertCircle size={40} color="var(--admin-accent)" style={{ marginBottom: '0.75rem' }} />
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--admin-primary)', margin: '0 0 0.35rem 0' }}>
                  No Projects Found
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', maxWidth: '440px', margin: '0 auto 1.25rem auto' }}>
                  {isFiltered
                    ? 'No projects match your active search or filter criteria. Try resetting your filters.'
                    : 'Your portfolio currently has no projects registered. Add your first interior work project to get started.'}
                </p>
                {isFiltered ? (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="btn btn-outline"
                    style={{ fontSize: '0.84rem' }}
                  >
                    Reset Filters
                  </button>
                ) : (
                  <Link to="/nimda-portal/projects/new" className="add-project-btn">
                    <Plus size={16} />
                    <span>Create Your First Project</span>
                  </Link>
                )}
              </div>
            ) : (
              <table className="projects-table">
                <thead>
                  <tr>
                    <th scope="col" style={{ width: '34%' }}>Project Details</th>
                    <th scope="col">Category</th>
                    <th scope="col">Location</th>
                    <th scope="col">Date</th>
                    <th scope="col">Status</th>
                    <th scope="col">Featured</th>
                    <th scope="col">Updated</th>
                    <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id}>
                      {/* Project info cell */}
                      <td>
                        <div className="project-info-cell">
                          <img
                            src={project.cover_image}
                            alt=""
                            className="project-row-thumb"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.src = '/projects/project-1.jpg';
                            }}
                          />
                          <div>
                            <Link
                              to={`/nimda-portal/projects/${project.id}/edit`}
                              className="project-title-text"
                              title="Edit project details"
                            >
                              {project.title}
                            </Link>
                            <span className="project-slug-pill">
                              /{project.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        <span className="category-badge-chip">
                          {project.category?.name || 'Interior Work'}
                        </span>
                      </td>

                      {/* Location */}
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                          <MapPin size={13} color="var(--admin-accent)" />
                          <span>{project.location || 'Delhi NCR'}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          <Calendar size={12} />
                          <span>
                            {project.project_date
                              ? new Date(project.project_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                              : 'Delivered'}
                          </span>
                        </div>
                      </td>

                      {/* Status Toggle Button */}
                      <td>
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(project)}
                          className={`status-badge ${project.is_published ? 'published' : 'draft'}`}
                          style={{ cursor: 'pointer', border: '1px solid currentColor' }}
                          title={`Click to ${project.is_published ? 'unpublish (save as draft)' : 'publish'}`}
                          aria-label={`Toggle publication status for ${project.title}`}
                        >
                          {project.is_published ? '● Published' : '○ Draft'}
                        </button>
                      </td>

                      {/* Featured Toggle Button */}
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(project)}
                          className={`featured-toggle-btn ${project.is_featured ? 'is-active' : 'is-inactive'}`}
                          title={`Click to ${project.is_featured ? 'remove from featured' : 'mark as featured'}`}
                          aria-label={`Toggle featured highlight for ${project.title}`}
                        >
                          <Star
                            size={12}
                            fill={project.is_featured ? 'var(--admin-accent)' : 'none'}
                          />
                          <span>{project.is_featured ? 'Featured' : 'Standard'}</span>
                        </button>
                      </td>

                      {/* Updated Date */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.76rem', color: 'var(--color-text-light)' }}>
                          <Clock size={11} />
                          <span>
                            {project.updated_at
                              ? new Date(project.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                              : 'Recent'}
                          </span>
                        </div>
                      </td>

                      {/* Row Actions */}
                      <td>
                        <div className="row-actions-group">
                          {/* Preview Public Site */}
                          <Link
                            to={`/projects/${project.slug}?preview=true`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="action-icon-btn"
                            title="Preview project page (opens in new tab)"
                            aria-label={`Preview ${project.title}`}
                          >
                            <Eye size={15} />
                          </Link>

                          {/* Edit Form */}
                          <Link
                            to={`/nimda-portal/projects/${project.id}/edit`}
                            className="action-icon-btn"
                            title="Edit project details and images"
                            aria-label={`Edit ${project.title}`}
                          >
                            <Edit3 size={15} />
                          </Link>

                          {/* Delete Trigger */}
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(project)}
                            className="action-icon-btn btn-delete"
                            title="Delete this project permanently"
                            aria-label={`Delete ${project.title}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="projects-pagination">
              <span className="pagination-info">
                Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} total projects)
              </span>

              <div className="pagination-controls">
                <button
                  type="button"
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="page-nav-btn"
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                  className="page-nav-btn"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 6. DELETE CONFIRMATION MODAL */}
        {deleteTarget && (
          <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
            <div className="modal-card">
              <div className="modal-header">
                <div className="modal-danger-icon" aria-hidden="true">
                  <Trash2 size={22} />
                </div>
                <div>
                  <h2 id="delete-dialog-title" className="modal-title">Delete Project</h2>
                  <p className="modal-desc">
                    Are you sure you want to permanently delete this interior project? This action cannot easily be undone.
                  </p>
                </div>
              </div>

              <div className="modal-target-box">
                <img
                  src={deleteTarget.cover_image}
                  alt=""
                  className="modal-target-thumb"
                  onError={(e) => {
                    e.currentTarget.src = '/projects/project-1.jpg';
                  }}
                />
                <div>
                  <div className="modal-target-title">{deleteTarget.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Slug: <code>/{deleteTarget.slug}</code> • ID: {deleteTarget.id}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.82rem', color: '#dc3545', margin: 0, lineHeight: 1.5 }}>
                ⚠️ All associated gallery records in <code>project_images</code> and files in Supabase Storage will be purged.
              </p>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="btn btn-outline"
                  style={{ fontSize: '0.85rem' }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="btn btn-primary"
                  style={{
                    fontSize: '0.85rem',
                    background: '#dc3545',
                    borderColor: '#dc3545',
                    color: '#ffffff'
                  }}
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete Project Permanently</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 7. TOAST NOTIFICATION */}
        {toast && (
          <div
            className="admin-toast-banner"
            role="status"
            style={{
              borderLeft: toast.type === 'error' ? '4px solid #dc3545' : '4px solid var(--admin-accent)'
            }}
          >
            {toast.type === 'error' ? (
              <AlertCircle size={18} color="#dc3545" />
            ) : (
              <CheckCircle2 size={18} color="var(--admin-accent)" />
            )}
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
