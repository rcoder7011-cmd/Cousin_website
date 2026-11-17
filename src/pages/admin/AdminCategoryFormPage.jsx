import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  UploadCloud,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FolderKanban,
  Image as ImageIcon,
  X,
  Sparkles,
  Info,
  Check,
  ShieldAlert
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import MediaPickerModal from '../../components/admin/MediaPickerModal';
import {
  getCategoryByIdAdmin,
  createCategory,
  updateCategory,
  deleteCategorySafe,
  checkCategorySlugAvailability,
  INITIAL_SUGGESTED_CATEGORIES
} from '../../services/categoryService';
import {
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
  resolveImageUrl
} from '../../services/projectImageService';
import './AdminCategoryFormPage.css';

// Slug helper function
function generateSlug(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminCategoryFormPage({ mode = 'create' }) {
  const { id } = useParams();
  const navigate = useNavigate();

  // Form Field State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [slugStatus, setSlugStatus] = useState({ checking: false, available: true, message: '' });
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  // Image State
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  // Metadata / Stats in Edit Mode
  const [projectsCount, setProjectsCount] = useState(0);
  const [createdAt, setCreatedAt] = useState(null);

  // UI State
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [toast, setToast] = useState(null);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Media Picker Modal State
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const fileInputRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Fetch category data in edit mode
  useEffect(() => {
    if (mode !== 'edit' || !id) return;

    let isMounted = true;
    async function fetchCategory() {
      setIsLoading(true);
      setGeneralError(null);
      try {
        const { data, error } = await getCategoryByIdAdmin(id);
        if (!isMounted) return;

        if (error || !data) {
          throw error || new Error('Category not found.');
        }

        setName(data.name || '');
        setSlug(data.slug || '');
        setSlugManuallyEdited(true); // Don't auto-overwrite existing slug
        setDescription(data.description || '');
        setDisplayOrder(data.display_order ?? 0);
        setIsActive(Boolean(data.is_active));
        setExistingImageUrl(data.image_url || null);
        setProjectsCount(data.projects_count ?? 0);
        setCreatedAt(data.created_at || null);
      } catch (err) {
        if (!isMounted) return;
        console.error('[AdminCategoryFormPage] Load error:', err);
        setGeneralError(err.message || 'Failed to retrieve category details from database.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchCategory();
    return () => { isMounted = false; };
  }, [mode, id]);

  // 2. Auto-generate slug from name in create mode
  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);

    if (fieldErrors.name) {
      setFieldErrors(prev => ({ ...prev, name: null }));
    }

    if (!slugManuallyEdited) {
      const generated = generateSlug(val);
      setSlug(generated);
    }
  };

  // 3. Debounced slug uniqueness verification
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!slug || !slug.trim()) {
        setSlugStatus({ checking: false, available: true, message: '' });
        return;
      }

      setSlugStatus({ checking: true, available: true, message: 'Validating availability...' });
      const excludeId = mode === 'edit' ? id : null;
      const { isAvailable, error } = await checkCategorySlugAvailability(slug.trim(), excludeId);

      if (error) {
        setSlugStatus({ checking: false, available: true, message: '' });
      } else if (!isAvailable) {
        setSlugStatus({
          checking: false,
          available: false,
          message: `The slug "${slug.trim()}" is already taken by another category.`
        });
      } else {
        setSlugStatus({
          checking: false,
          available: true,
          message: 'Slug is unique and available.'
        });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [slug, mode, id]);

  // 4. Handle Image File Selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setFieldErrors(prev => ({
        ...prev,
        image: `Invalid format (${file.type}). Please select JPEG, PNG, WebP, or SVG.`
      }));
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFieldErrors(prev => ({
        ...prev,
        image: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds 10MB limit.`
      }));
      return;
    }

    setFieldErrors(prev => ({ ...prev, image: null }));
    setNewImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setRemoveExistingImage(false);
  };

  // Handle Drag & Drop
  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const fakeEvent = { target: { files: [file] } };
      handleFileSelect(fakeEvent);
    }
  };

  // Remove Selected/Existing Image
  const handleClearImage = () => {
    setNewImageFile(null);
    setImagePreviewUrl(null);
    if (existingImageUrl) {
      setRemoveExistingImage(true);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Restore Existing Image
  const handleRestoreImage = () => {
    setRemoveExistingImage(false);
    setNewImageFile(null);
    setImagePreviewUrl(null);
  };

  // Media Library Selection
  const handleMediaPickerSelect = (selected) => {
    const item = Array.isArray(selected) ? selected[0] : selected;
    if (item && item.public_url) {
      setExistingImageUrl(item.public_url);
      setImagePreviewUrl(item.public_url);
      setNewImageFile(null);
      setRemoveExistingImage(false);
      setFieldErrors(prev => ({ ...prev, image: null }));
    }
    setShowMediaPicker(false);
  };

  // Quick Preset Selection (for create mode)
  const handleApplyPreset = (preset) => {
    setName(preset.name);
    setSlug(preset.slug);
    setSlugManuallyEdited(true);
    setDescription(preset.description || '');
    setDisplayOrder(preset.display_order ?? 0);
    setIsActive(true);
  };

  // 5. Validation
  const validateForm = () => {
    const errs = {};

    if (!name.trim()) {
      errs.name = 'Category name is required.';
    }

    if (!slug.trim()) {
      errs.slug = 'Category slug is required.';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
      errs.slug = 'Slug must only contain lowercase letters, numbers, and single hyphens (e.g. "living-room").';
    } else if (!slugStatus.available) {
      errs.slug = slugStatus.message || 'This slug is already in use.';
    }

    const orderNum = parseInt(displayOrder, 10);
    if (isNaN(orderNum) || orderNum < 0) {
      errs.displayOrder = 'Display order must be a positive number or zero.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // 6. Submit Category
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Please correct the highlighted fields before saving.', 'error');
      return;
    }

    setIsSubmitting(true);
    setGeneralError(null);

    try {
      const categoryPayload = {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim() || null,
        display_order: parseInt(displayOrder, 10) || 0,
        is_active: isActive,
        image_url: removeExistingImage ? null : existingImageUrl
      };

      if (mode === 'create') {
        const { error } = await createCategory(categoryPayload, newImageFile);
        if (error) throw error;

        showToast(`Category "${name.trim()}" created successfully!`);
        setTimeout(() => {
          navigate('/admin/categories');
        }, 900);
      } else {
        const { error } = await updateCategory(id, categoryPayload, {
          newImageFile,
          removeImage: removeExistingImage
        });
        if (error) throw error;

        showToast(`Category "${name.trim()}" updated successfully!`);
        setTimeout(() => {
          navigate('/admin/categories');
        }, 900);
      }
    } catch (err) {
      console.error('[AdminCategoryFormPage] Submit error:', err);
      setGeneralError(err.message || 'Failed to save category. Please check Supabase permissions.');
      showToast(err.message || 'Failed to save category', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 7. Delete Safe Confirmation (in Edit Mode)
  const handleConfirmDelete = async () => {
    if (projectsCount > 0) {
      showToast(
        `Cannot delete: ${projectsCount} project(s) are assigned to this category.`,
        'error'
      );
      return;
    }

    setIsDeleting(true);
    const { success, blocked, error } = await deleteCategorySafe(id);
    setIsDeleting(false);

    if (blocked || !success) {
      showToast(error?.message || 'Deletion blocked: projects are associated with this category.', 'error');
    } else {
      showToast(`Category "${name}" deleted successfully.`);
      setShowDeleteModal(false);
      setTimeout(() => {
        navigate('/admin/categories');
      }, 700);
    }
  };

  const effectivePreviewImage = imagePreviewUrl || (!removeExistingImage ? resolveImageUrl(existingImageUrl) : null);

  return (
    <AdminLayout pageTitle={mode === 'create' ? 'Add New Category' : `Edit Category: ${name || 'Category'}`}>
      <div className="admin-category-form-container">
        {/* TOAST NOTIFICATION */}
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

        {/* 1. TOP HEADER & NAVIGATION BAR */}
        <div className="form-header-bar">
          <div className="header-left">
            <Link to="/admin/categories" className="back-link">
              <ArrowLeft size={16} />
              <span>Back to Categories</span>
            </Link>
            <h1 className="form-main-title">
              {mode === 'create' ? 'Add New Category' : `Edit Category: ${name || 'Loading...'}`}
            </h1>
            <p className="form-sub-title">
              {mode === 'create'
                ? 'Create a new room classification for interior design projects.'
                : 'Modify category specifications, display ordering, image, and public visibility.'}
            </p>
          </div>

          <div className="header-actions">
            <Link to="/admin/categories" className="btn btn-outline">
              Cancel
            </Link>

            {mode === 'edit' && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="btn btn-danger-outline"
                title="Delete this category safely"
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || isLoading}
              className="btn btn-primary submit-btn"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="spin-icon" />
                  <span>Saving Category...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>{mode === 'create' ? 'Create Category' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* GENERAL ERROR BANNER */}
        {generalError && (
          <div className="form-error-callout" role="alert">
            <AlertCircle size={20} color="#dc3545" />
            <div className="error-text-content">
              <strong>Action Failed:</strong> {generalError}
            </div>
          </div>
        )}

        {/* LOADING SHIMMER */}
        {isLoading ? (
          <div className="form-loading-card skeleton-shimmer">
            <div className="skeleton-line" style={{ width: '40%', height: '24px' }} />
            <div className="skeleton-line" style={{ width: '100%', height: '44px' }} />
            <div className="skeleton-line" style={{ width: '80%', height: '44px' }} />
            <div className="skeleton-line" style={{ width: '100%', height: '120px' }} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="category-form-layout" noValidate>
            {/* LEFT COLUMN: MAIN FIELDS */}
            <div className="form-column-main">
              {/* SUGGESTED PRESET PICKER IN CREATE MODE */}
              {mode === 'create' && (
                <div className="form-card preset-card">
                  <div className="card-header-row">
                    <div className="header-title-wrap">
                      <Sparkles size={16} className="preset-sparkle" />
                      <h2 className="card-heading">Quick Suggested Templates</h2>
                    </div>
                    <span className="card-caption">Click to auto-populate standard room types</span>
                  </div>
                  <div className="preset-pills-row">
                    {INITIAL_SUGGESTED_CATEGORIES.map((preset) => (
                      <button
                        key={preset.slug}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className={`preset-pill ${name === preset.name ? 'is-selected' : ''}`}
                      >
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CARD 1: CATEGORY INFORMATION */}
              <div className="form-card">
                <div className="card-header-row">
                  <h2 className="card-heading">Category Information</h2>
                  <span className="card-caption">Core identifying details</span>
                </div>

                <div className="card-body-fields">
                  {/* Category Name */}
                  <div className="form-field-group">
                    <label htmlFor="cat-name" className="form-label">
                      <span>Category Name</span>
                      <span className="required-star">*</span>
                    </label>
                    <input
                      id="cat-name"
                      type="text"
                      value={name}
                      onChange={handleNameChange}
                      placeholder="e.g. Master Bedroom, Modular Kitchen, Living Room"
                      className={`form-input ${fieldErrors.name ? 'has-error' : ''}`}
                      required
                    />
                    {fieldErrors.name && (
                      <span className="form-error-msg">{fieldErrors.name}</span>
                    )}
                  </div>

                  {/* Category Slug */}
                  <div className="form-field-group">
                    <div className="label-with-hint">
                      <label htmlFor="cat-slug" className="form-label">
                        <span>Category Slug</span>
                        <span className="required-star">*</span>
                      </label>
                      <span className="label-hint">Used in URLs and filters</span>
                    </div>
                    <div className="slug-input-wrapper">
                      <span className="slug-prefix">saifiinteriorhub.in/projects/</span>
                      <input
                        id="cat-slug"
                        type="text"
                        value={slug}
                        onChange={(e) => {
                          setSlug(e.target.value.toLowerCase());
                          setSlugManuallyEdited(true);
                          if (fieldErrors.slug) {
                            setFieldErrors(prev => ({ ...prev, slug: null }));
                          }
                        }}
                        placeholder="e.g. master-bedroom"
                        className={`form-input slug-input ${fieldErrors.slug || !slugStatus.available ? 'has-error' : ''}`}
                        required
                      />
                    </div>
                    {/* Slug Status Feedback */}
                    {slug && (
                      <div className="slug-status-indicator">
                        {slugStatus.checking ? (
                          <span className="slug-msg slug-checking">
                            <RefreshCw size={12} className="spin-icon" /> Checking availability...
                          </span>
                        ) : !slugStatus.available ? (
                          <span className="slug-msg slug-taken">
                            <AlertCircle size={12} /> {slugStatus.message}
                          </span>
                        ) : (
                          <span className="slug-msg slug-available">
                            <Check size={12} /> Available
                          </span>
                        )}
                      </div>
                    )}
                    {fieldErrors.slug && (
                      <span className="form-error-msg">{fieldErrors.slug}</span>
                    )}
                  </div>

                  {/* Description */}
                  <div className="form-field-group">
                    <div className="label-with-hint">
                      <label htmlFor="cat-desc" className="form-label">
                        <span>Description</span>
                        <span className="optional-tag">(Optional)</span>
                      </label>
                      <span className="char-counter">{description.length}/350</span>
                    </div>
                    <textarea
                      id="cat-desc"
                      rows={4}
                      value={description}
                      maxLength={350}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Briefly describe the interior scope, materials, or features of this category..."
                      className="form-textarea"
                    />
                    <span className="field-hint-text">
                      Displayed on the website to guide clients through your specialized services.
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD 2: CATEGORY IMAGE MANAGEMENT */}
              <div className="form-card">
                <div className="card-header-row">
                  <div className="header-title-wrap">
                    <ImageIcon size={18} />
                    <h2 className="card-heading">Category Showcase Image</h2>
                  </div>
                  <span className="card-caption">Optional cover thumbnail</span>
                </div>

                <div className="card-body-fields">
                  {effectivePreviewImage ? (
                    <div className="image-preview-card">
                      <div className="preview-img-wrapper">
                        <img
                          src={effectivePreviewImage}
                          alt={name || 'Category showcase'}
                          className="preview-img-display"
                        />
                      </div>
                      <div className="preview-info-strip">
                        <div className="preview-meta">
                          <span className="preview-name">
                            {newImageFile ? newImageFile.name : 'Current Category Image'}
                          </span>
                          <span className="preview-size">
                            {newImageFile ? `${(newImageFile.size / 1024).toFixed(0)} KB` : 'Stored in Supabase Storage'}
                          </span>
                        </div>
                        <div className="preview-actions">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="btn btn-outline btn-sm"
                          >
                            Replace Image
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowMediaPicker(true)}
                            className="btn btn-outline btn-sm"
                          >
                            <ImageIcon size={14} style={{ marginRight: '0.25rem' }} />
                            Library
                          </button>
                          <button
                            type="button"
                            onClick={handleClearImage}
                            className="btn btn-danger-outline btn-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : removeExistingImage ? (
                    <div className="image-removed-banner">
                      <Info size={16} />
                      <span>Existing image will be removed upon saving.</span>
                      <button
                        type="button"
                        onClick={handleRestoreImage}
                        className="restore-img-btn"
                      >
                        Undo Remove
                      </button>
                    </div>
                  ) : (
                    <div
                      className="image-dropzone"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <UploadCloud size={38} className="dropzone-icon" />
                      <div className="dropzone-text">
                        <span className="dropzone-title">Click to upload or drag & drop</span>
                        <span className="dropzone-subtitle">
                          Supported formats: JPEG, PNG, WebP, SVG • Maximum size: 10MB
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                        >
                          Browse Files
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMediaPicker(true);
                          }}
                        >
                          <ImageIcon size={14} style={{ marginRight: '0.25rem' }} />
                          Choose from Media Library
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />

                  {fieldErrors.image && (
                    <span className="form-error-msg">{fieldErrors.image}</span>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: SETTINGS & RELATIONSHIP INFO */}
            <div className="form-column-sidebar">
              {/* CARD 3: PUBLICATION & VISIBILITY */}
              <div className="form-card">
                <div className="card-header-row">
                  <h2 className="card-heading">Visibility & Status</h2>
                </div>

                <div className="card-body-fields">
                  {/* Active Toggle Switch */}
                  <div className="toggle-setting-row">
                    <div className="toggle-meta">
                      <span className="toggle-title">Active Status</span>
                      <span className="toggle-desc">
                        {isActive
                          ? 'Visible in public project filters and gallery navigation.'
                          : 'Hidden from public website. Existing projects remain assigned.'}
                      </span>
                    </div>
                    <label className="switch-label">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="switch-input"
                      />
                      <span className="switch-slider" />
                    </label>
                  </div>

                  <div className="status-badge-preview">
                    <span className={`status-pill ${isActive ? 'pill-active' : 'pill-inactive'}`}>
                      <span className="status-dot" />
                      {isActive ? 'Publicly Active' : 'Privately Inactive'}
                    </span>
                  </div>

                  <hr className="card-divider" />

                  {/* Display Order */}
                  <div className="form-field-group">
                    <label htmlFor="cat-order" className="form-label">
                      <span>Display Sequence Order</span>
                    </label>
                    <input
                      id="cat-order"
                      type="number"
                      min="0"
                      step="1"
                      value={displayOrder}
                      onChange={(e) => setDisplayOrder(e.target.value)}
                      className={`form-input ${fieldErrors.displayOrder ? 'has-error' : ''}`}
                    />
                    <span className="field-hint-text">
                      Lower numbers appear first in gallery category tabs (e.g. 1 = first, 2 = second).
                    </span>
                    {fieldErrors.displayOrder && (
                      <span className="form-error-msg">{fieldErrors.displayOrder}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* CARD 4: ASSOCIATED PROJECTS INFO (IN EDIT MODE) */}
              {mode === 'edit' && (
                <div className="form-card">
                  <div className="card-header-row">
                    <div className="header-title-wrap">
                      <FolderKanban size={16} />
                      <h2 className="card-heading">Associated Projects</h2>
                    </div>
                  </div>

                  <div className="card-body-fields">
                    <div className="projects-summary-box">
                      <div className="projects-count-display">
                        <span className="count-large">{projectsCount}</span>
                        <span className="count-label">
                          {projectsCount === 1 ? 'Project Assigned' : 'Projects Assigned'}
                        </span>
                      </div>

                      {projectsCount > 0 ? (
                        <Link
                          to={`/admin/projects?category=${id}`}
                          className="btn btn-outline view-projects-btn"
                        >
                          <FolderKanban size={15} />
                          <span>View Assigned Projects</span>
                        </Link>
                      ) : (
                        <p className="no-projects-hint">
                          No projects currently assigned. This category can be safely deleted if no longer needed.
                        </p>
                      )}
                    </div>

                    {createdAt && (
                      <div className="creation-meta-row">
                        <span className="meta-label">Created:</span>
                        <span className="meta-value">
                          {new Date(createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SAVE / SUBMIT ACTIONS CARD */}
              <div className="form-card form-action-card">
                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="btn btn-primary submit-full-btn"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={16} className="spin-icon" />
                      <span>Saving Category...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>{mode === 'create' ? 'Create Category' : 'Save Category Changes'}</span>
                    </>
                  )}
                </button>

                <Link to="/admin/categories" className="btn btn-outline cancel-full-btn">
                  Cancel
                </Link>
              </div>
            </div>
          </form>
        )}

        {/* SAFE DELETE CONFIRMATION MODAL (EDIT MODE) */}
        {showDeleteModal && (
          <div
            className="admin-modal-backdrop"
            onClick={() => !isDeleting && setShowDeleteModal(false)}
            role="presentation"
          >
            <div
              className="admin-modal-box"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-cat-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className={`modal-icon-badge ${projectsCount > 0 ? 'badge-warning' : 'badge-danger'}`}>
                  {projectsCount > 0 ? <ShieldAlert size={22} /> : <AlertCircle size={22} />}
                </div>
                <div className="modal-title-group">
                  <h2 id="delete-cat-title" className="modal-heading">
                    {projectsCount > 0 ? 'Deletion Blocked' : 'Delete Category Safely'}
                  </h2>
                  <span className="modal-subheading">
                    {name} ({slug})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => !isDeleting && setShowDeleteModal(false)}
                  className="modal-close-btn"
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                {projectsCount > 0 ? (
                  <div className="delete-blocked-warning">
                    <p className="modal-explanation">
                      <strong>Cannot delete this category.</strong> There {projectsCount === 1 ? 'is' : 'are'}{' '}
                      <span className="highlight-count">{projectsCount} project{projectsCount === 1 ? '' : 's'}</span>{' '}
                      currently assigned to <strong>"{name}"</strong>.
                    </p>
                    <p className="modal-sub-explanation">
                      To safeguard project integrity and prevent accidental data loss, categories cannot be deleted while projects reference them.
                      Please reassign or delete the associated projects first.
                    </p>
                  </div>
                ) : (
                  <div className="delete-confirmation-details">
                    <p className="modal-explanation">
                      Are you sure you want to permanently delete the category <strong>"{name}"</strong>?
                    </p>
                    <ul className="modal-impact-list">
                      <li>The category record will be removed from the database.</li>
                      <li>It will no longer appear in public filters.</li>
                      {existingImageUrl && <li>Its image file will be cleaned up from Storage.</li>}
                      <li><strong>0 projects</strong> are associated with this category.</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="btn btn-outline"
                >
                  Cancel
                </button>

                {projectsCount > 0 ? (
                  <Link
                    to={`/admin/projects?category=${id}`}
                    onClick={() => setShowDeleteModal(false)}
                    className="btn btn-primary"
                  >
                    <FolderKanban size={15} />
                    <span>View Associated Projects ({projectsCount})</span>
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

        {/* Media Picker Modal */}
        <MediaPickerModal
          isOpen={showMediaPicker}
          onClose={() => setShowMediaPicker(false)}
          onSelect={handleMediaPickerSelect}
          multiple={false}
          title="Choose Category Cover Image"
        />
      </div>
    </AdminLayout>
  );
}
