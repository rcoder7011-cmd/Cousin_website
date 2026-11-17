import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  Layers,
  FolderKanban,
  Sparkles,
  RotateCcw,
  Image as ImageIcon,
  ShieldAlert
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  getAdminCategories,
  toggleCategoryActive,
  deleteCategorySafe,
  seedInitialSuggestedCategories
} from '../../services/categoryService';
import { resolveImageUrl } from '../../services/projectImageService';
import { gsap, isReducedMotion } from '../../utils/gsapConfig';
import './AdminCategoriesPage.css';

export default function AdminCategoriesPage() {
  const containerRef = useRef(null);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [projectFilter, setProjectFilter] = useState('all'); // 'all' | 'with_projects' | 'without_projects'
  const [sortBy, setSortBy] = useState('order'); // 'order' | 'newest' | 'oldest' | 'alphabetical' | 'most_projects'
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Data State
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Metrics
  const [metrics, setMetrics] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    withProjects: 0
  });

  // Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [toast, setToast] = useState(null);

  // Toast Helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // 1. Fetch categories
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      setFetchError(null);
      try {
        const { data, count, error } = await getAdminCategories({
          search,
          status: statusFilter,
          projectFilter,
          sortBy
        });

        if (!isMounted) return;

        if (error && !data) {
          throw error;
        }

        const items = data || [];
        setCategories(items);

        // Calculate summary metrics when not filtering
        if (statusFilter === 'all' && projectFilter === 'all' && !search) {
          const act = items.filter(c => c.is_active).length;
          const inact = items.filter(c => !c.is_active).length;
          const withProj = items.filter(c => c.projects_count > 0).length;

          setMetrics({
            total: count || items.length,
            active: act,
            inactive: inact,
            withProjects: withProj
          });
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('[AdminCategoriesPage] Load error:', err);
        setFetchError(err.message || 'Unable to retrieve categories from database.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [search, statusFilter, projectFilter, sortBy, reloadTrigger]);

  // Entrance animations
  useGSAP(() => {
    if (isReducedMotion() || isLoading) return;

    gsap.from('.categories-header-card, .categories-summary-strip, .categories-toolbar', {
      y: 16,
      opacity: 0,
      duration: 0.45,
      stagger: 0.08,
      ease: 'power3.out'
    });
  }, { scope: containerRef, dependencies: [isLoading] });

  // Handle Quick Toggle Active
  const handleToggleActive = async (category) => {
    const nextActive = !category.is_active;

    // Optimistic UI update
    setCategories(prev =>
      prev.map(c => c.id === category.id ? { ...c, is_active: nextActive } : c)
    );

    const { error } = await toggleCategoryActive(category.id, nextActive);

    if (error) {
      showToast(`Failed to update status: ${error.message}`, 'error');
      // Rollback
      setCategories(prev =>
        prev.map(c => c.id === category.id ? { ...c, is_active: !nextActive } : c)
      );
    } else {
      showToast(
        nextActive
          ? `"${category.name}" is now active and visible on the public website.`
          : `"${category.name}" is now inactive and hidden from public filters.`
      );
      // Trigger recount of metrics
      setReloadTrigger(prev => prev + 1);
    }
  };

  // Handle Delete Confirmation Modal Open
  const promptDeleteCategory = (category) => {
    setDeleteTarget(category);
  };

  // Handle Safe Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    // Double-check if projects exist
    if (deleteTarget.projects_count > 0) {
      showToast(
        `Cannot delete "${deleteTarget.name}": It has ${deleteTarget.projects_count} associated project(s).`,
        'error'
      );
      return;
    }

    setIsDeleting(true);
    const { success, blocked, projectCount, error } = await deleteCategorySafe(deleteTarget.id);
    setIsDeleting(false);

    if (blocked || !success) {
      showToast(
        error?.message || `Deletion blocked: ${projectCount || 'Several'} project(s) are associated with this category.`,
        'error'
      );
    } else {
      showToast(`Category "${deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);
      setReloadTrigger(prev => prev + 1);
    }
  };

  // Handle Seed Suggested Categories
  const handleSeedSuggested = async () => {
    setIsSeeding(true);
    try {
      const { inserted, error } = await seedInitialSuggestedCategories();
      if (error) throw error;

      if (inserted > 0) {
        showToast(`Successfully added ${inserted} suggested category(ies)!`);
      } else {
        showToast('All initial suggested categories already exist in your system.');
      }
      setReloadTrigger(prev => prev + 1);
    } catch (err) {
      showToast(`Seeding failed: ${err.message}`, 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setProjectFilter('all');
    setSortBy('order');
  };

  const isFiltering = search || statusFilter !== 'all' || projectFilter !== 'all' || sortBy !== 'order';

  return (
    <AdminLayout pageTitle="Category Management">
      <div ref={containerRef} className="admin-categories-container">
        {/* TOAST FEEDBACK NOTIFICATION */}
        {toast && (
          <div
            className={`admin-toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}
            role="status"
            aria-live="polite"
          >
            {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="toast-close-btn"
              aria-label="Dismiss message"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* 1. PAGE HEADER */}
        <header className="categories-header-card">
          <div className="categories-header-left">
            <div className="categories-badge">
              <Layers size={13} />
              <span>Taxonomy & Spaces</span>
            </div>
            <h1 className="categories-header-title">Category Management</h1>
            <p className="categories-header-sub">
              Organize and manage your interior design project categories.
            </p>
          </div>

          <div className="categories-header-actions">
            <button
              type="button"
              onClick={handleSeedSuggested}
              disabled={isSeeding}
              className="btn btn-outline seed-suggested-btn"
              title="Add initial suggested categories (Bedroom, Kitchen, Living Room, Office, POP Ceiling, Wardrobe) if missing"
            >
              <Sparkles size={16} />
              <span>{isSeeding ? 'Checking...' : 'Seed Suggested'}</span>
            </button>

            <Link to="/admin/categories/new" className="add-category-btn">
              <Plus size={18} />
              <span>+ Add New Category</span>
            </Link>
          </div>
        </header>

        {/* 2. SUMMARY METRICS STRIP */}
        <section className="categories-summary-strip" aria-label="Category statistics">
          <div className="summary-pill-card">
            <span className="summary-pill-label">Total Categories</span>
            <span className="summary-pill-num">{isLoading ? '—' : metrics.total}</span>
          </div>
          <div className="summary-pill-card">
            <span className="summary-pill-label">Active (Public)</span>
            <span className="summary-pill-num summary-pill-active">{isLoading ? '—' : metrics.active}</span>
          </div>
          <div className="summary-pill-card">
            <span className="summary-pill-label">Inactive (Hidden)</span>
            <span className="summary-pill-num summary-pill-inactive">{isLoading ? '—' : metrics.inactive}</span>
          </div>
          <div className="summary-pill-card">
            <span className="summary-pill-label">With Projects</span>
            <span className="summary-pill-num">{isLoading ? '—' : metrics.withProjects}</span>
          </div>
        </section>

        {/* 3. TOOLBAR (SEARCH, FILTERS, SORTS) */}
        <section className="categories-toolbar" aria-label="Category filters and search">
          <div className="toolbar-search-box">
            <Search size={16} className="search-icon" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by category name or slug..."
              className="search-input"
              aria-label="Search categories"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="search-clear-btn"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="toolbar-controls-group">
            {/* Status Filter */}
            <div className="control-select-wrap">
              <label htmlFor="status-filter" className="sr-only">Filter by status</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="control-select"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            {/* Project Filter */}
            <div className="control-select-wrap">
              <label htmlFor="project-filter" className="sr-only">Filter by project association</label>
              <select
                id="project-filter"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="control-select"
              >
                <option value="all">All Project Allocations</option>
                <option value="with_projects">Categories With Projects</option>
                <option value="without_projects">Categories Without Projects</option>
              </select>
            </div>

            {/* Sort Options */}
            <div className="control-select-wrap">
              <label htmlFor="sort-by" className="sr-only">Sort categories</label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="control-select"
              >
                <option value="order">Sort: Display Order</option>
                <option value="alphabetical">Sort: Alphabetical (A-Z)</option>
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="most_projects">Sort: Most Projects</option>
              </select>
            </div>

            {/* Reset Filters */}
            {isFiltering && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-outline reset-filters-btn"
                title="Reset all search and filter conditions"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            )}

            {/* Refresh */}
            <button
              type="button"
              onClick={() => setReloadTrigger(prev => prev + 1)}
              className="btn btn-outline refresh-btn"
              title="Reload categories from database"
            >
              <RefreshCw size={14} className={isLoading ? 'spin-icon' : ''} />
            </button>
          </div>
        </section>

        {/* ERROR CALLOUT BANNER */}
        {fetchError && (
          <div className="categories-error-banner" role="alert">
            <div className="error-left">
              <AlertCircle size={20} color="#dc3545" />
              <span>{fetchError}</span>
            </div>
            <button
              type="button"
              onClick={() => setReloadTrigger(prev => prev + 1)}
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* 4. MAIN CATEGORIES TABLE & CARD VIEW */}
        <section className="categories-table-card" aria-label="Categories list table">
          {isLoading ? (
            <div className="table-loading-container">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="table-skeleton-row skeleton-shimmer">
                  <div className="skeleton-cell skeleton-thumb" />
                  <div className="skeleton-cell skeleton-text-lg" />
                  <div className="skeleton-cell skeleton-text-sm" />
                  <div className="skeleton-cell skeleton-pill" />
                  <div className="skeleton-cell skeleton-actions" />
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="categories-empty-state">
              <div className="empty-icon-wrap">
                <Layers size={36} />
              </div>
              <h2 className="empty-title">
                {isFiltering ? 'No categories match your filter criteria' : 'No categories configured yet'}
              </h2>
              <p className="empty-desc">
                {isFiltering
                  ? 'Try clearing the search query or adjusting your status and project filters.'
                  : 'Start organizing your design portfolio by adding room categories or seeding standard room types.'}
              </p>
              <div className="empty-actions">
                {isFiltering ? (
                  <button type="button" onClick={handleResetFilters} className="btn btn-outline">
                    <RotateCcw size={15} />
                    <span>Clear All Filters</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleSeedSuggested}
                      disabled={isSeeding}
                      className="btn btn-outline"
                    >
                      <Sparkles size={16} />
                      <span>{isSeeding ? 'Seeding...' : 'Seed Suggested Categories'}</span>
                    </button>
                    <Link to="/admin/categories/new" className="add-category-btn">
                      <Plus size={16} />
                      <span>+ Add New Category</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="categories-table-responsive">
              <table className="admin-categories-table">
                <thead>
                  <tr>
                    <th scope="col" style={{ width: '80px' }}>Image</th>
                    <th scope="col">Category</th>
                    <th scope="col">Slug</th>
                    <th scope="col" className="col-desc">Description</th>
                    <th scope="col" style={{ textAlign: 'center', width: '130px' }}>Projects</th>
                    <th scope="col" style={{ textAlign: 'center', width: '110px' }}>Status</th>
                    <th scope="col" style={{ textAlign: 'center', width: '90px' }}>Order</th>
                    <th scope="col" className="col-date" style={{ width: '120px' }}>Created</th>
                    <th scope="col" style={{ textAlign: 'right', width: '170px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => {
                    const hasProjects = category.projects_count > 0;
                    const createdFormatted = category.created_at
                      ? new Date(category.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })
                      : '—';

                    return (
                      <tr key={category.id} className={`category-row ${!category.is_active ? 'row-inactive' : ''}`}>
                        {/* Image Thumbnail */}
                        <td>
                          {category.image_url ? (
                            <button
                              type="button"
                              onClick={() => setImagePreviewUrl(category.image_url)}
                              className="cat-thumb-btn"
                              title={`Preview image for ${category.name}`}
                              aria-label={`Preview full image for ${category.name}`}
                            >
                              <img
                                src={resolveImageUrl(category.image_url)}
                                alt={category.name}
                                className="cat-thumb-img"
                                loading="lazy"
                              />
                            </button>
                          ) : (
                            <div className="cat-thumb-placeholder" title="No category image set">
                              <ImageIcon size={18} />
                            </div>
                          )}
                        </td>

                        {/* Name & Title */}
                        <td>
                          <div className="cat-title-cell">
                            <span className="cat-primary-name">{category.name}</span>
                            <span className="cat-mobile-slug">{category.slug}</span>
                          </div>
                        </td>

                        {/* Slug */}
                        <td>
                          <span className="cat-slug-badge" title="URL identifier">
                            {category.slug}
                          </span>
                        </td>

                        {/* Description */}
                        <td className="col-desc">
                          <p className="cat-desc-text" title={category.description}>
                            {category.description || <span className="cat-muted-italic">No description</span>}
                          </p>
                        </td>

                        {/* Associated Projects Count */}
                        <td style={{ textAlign: 'center' }}>
                          {hasProjects ? (
                            <Link
                              to={`/admin/projects?category=${category.id}`}
                              className="projects-count-badge has-count"
                              title={`View ${category.projects_count} project(s) assigned to ${category.name}`}
                            >
                              <FolderKanban size={13} />
                              <span>{category.projects_count} {category.projects_count === 1 ? 'project' : 'projects'}</span>
                            </Link>
                          ) : (
                            <span className="projects-count-badge no-count" title="No projects currently assigned">
                              0 projects
                            </span>
                          )}
                        </td>

                        {/* Status Toggle / Badge */}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(category)}
                            className={`status-toggle-btn ${category.is_active ? 'is-active' : 'is-inactive'}`}
                            title={category.is_active ? 'Click to deactivate (hide from website)' : 'Click to activate (show on website)'}
                            aria-label={`Toggle status for ${category.name}, currently ${category.is_active ? 'Active' : 'Inactive'}`}
                          >
                            <span className="status-dot" aria-hidden="true" />
                            <span>{category.is_active ? 'Active' : 'Inactive'}</span>
                          </button>
                        </td>

                        {/* Display Order */}
                        <td style={{ textAlign: 'center' }}>
                          <span className="order-pill" title="Display sorting sequence">
                            #{category.display_order ?? 0}
                          </span>
                        </td>

                        {/* Created Date */}
                        <td className="col-date">
                          <span className="created-text">{createdFormatted}</span>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div className="cat-action-group">
                            {/* View Projects */}
                            <Link
                              to={`/admin/projects?category=${category.id}`}
                              className="action-icon-btn"
                              title={`View projects assigned to ${category.name}`}
                              aria-label={`View projects assigned to ${category.name}`}
                            >
                              <FolderKanban size={15} />
                            </Link>

                            {/* Edit */}
                            <Link
                              to={`/admin/categories/${category.id}/edit`}
                              className="action-icon-btn"
                              title={`Edit category ${category.name}`}
                              aria-label={`Edit category ${category.name}`}
                            >
                              <Edit3 size={15} />
                            </Link>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => promptDeleteCategory(category)}
                              className="action-icon-btn action-delete-btn"
                              title={hasProjects ? `Deletion blocked: ${category.projects_count} project(s) assigned` : `Delete category ${category.name}`}
                              aria-label={`Delete category ${category.name}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 5. SAFE DELETE CONFIRMATION MODAL */}
        {deleteTarget && (
          <div
            className="admin-modal-backdrop"
            onClick={() => !isDeleting && setDeleteTarget(null)}
            role="presentation"
          >
            <div
              className="admin-modal-box"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className={`modal-icon-badge ${deleteTarget.projects_count > 0 ? 'badge-warning' : 'badge-danger'}`}>
                  {deleteTarget.projects_count > 0 ? <ShieldAlert size={22} /> : <AlertCircle size={22} />}
                </div>
                <div className="modal-title-group">
                  <h2 id="delete-modal-title" className="modal-heading">
                    {deleteTarget.projects_count > 0 ? 'Deletion Blocked' : 'Delete Category Safely'}
                  </h2>
                  <span className="modal-subheading">
                    {deleteTarget.name} ({deleteTarget.slug})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => !isDeleting && setDeleteTarget(null)}
                  className="modal-close-btn"
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                {deleteTarget.projects_count > 0 ? (
                  <div className="delete-blocked-warning">
                    <p className="modal-explanation">
                      <strong>Cannot delete this category.</strong> There {deleteTarget.projects_count === 1 ? 'is' : 'are'}{' '}
                      <span className="highlight-count">{deleteTarget.projects_count} project{deleteTarget.projects_count === 1 ? '' : 's'}</span>{' '}
                      currently assigned to <strong>"{deleteTarget.name}"</strong>.
                    </p>
                    <p className="modal-sub-explanation">
                      To safeguard project integrity and prevent accidental data or foreign key loss,
                      categories cannot be deleted while projects reference them.
                      Please reassign or delete the associated projects first.
                    </p>
                  </div>
                ) : (
                  <div className="delete-confirmation-details">
                    <p className="modal-explanation">
                      Are you sure you want to permanently delete the category <strong>"{deleteTarget.name}"</strong>?
                    </p>
                    <ul className="modal-impact-list">
                      <li>The category will be permanently removed from the database.</li>
                      <li>It will no longer appear in public navigation filters.</li>
                      {deleteTarget.image_url && <li>Its associated image file will be cleaned up from Storage.</li>}
                      <li><strong>0 projects</strong> are associated with this category.</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="btn btn-outline"
                >
                  Cancel
                </button>

                {deleteTarget.projects_count > 0 ? (
                  <Link
                    to={`/admin/projects?category=${deleteTarget.id}`}
                    onClick={() => setDeleteTarget(null)}
                    className="btn btn-primary"
                  >
                    <FolderKanban size={15} />
                    <span>View Associated Projects ({deleteTarget.projects_count})</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    className="btn btn-danger"
                  >
                    {isDeleting ? (
                      <>
                        <RefreshCw size={15} className="spin-icon" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={15} />
                        <span>Delete Category</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 6. IMAGE PREVIEW MODAL */}
        {imagePreviewUrl && (
          <div
            className="admin-modal-backdrop"
            onClick={() => setImagePreviewUrl(null)}
            role="presentation"
          >
            <div
              className="image-preview-modal-box"
              role="dialog"
              aria-modal="true"
              aria-label="Category image preview"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="image-preview-header">
                <span className="preview-label">Category Image Preview</span>
                <button
                  type="button"
                  onClick={() => setImagePreviewUrl(null)}
                  className="modal-close-btn"
                  aria-label="Close preview"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="image-preview-body">
                <img
                  src={resolveImageUrl(imagePreviewUrl)}
                  alt="Category preview"
                  className="preview-full-img"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
