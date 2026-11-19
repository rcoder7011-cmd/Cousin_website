import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  UploadCloud,
  Trash2,
  ChevronUp,
  ChevronDown,
  Star,
  Eye,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  FolderKanban,
  ImageIcon
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import MediaPickerModal from '../../components/admin/MediaPickerModal';
import {
  getAdminProjectById,
  createProjectFull,
  updateProjectFull,
  deleteProjectFull,
  checkSlugAvailability
} from '../../services/projectService';
import { getCategories } from '../../services/categoryService';
import {
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
  resolveImageUrl
} from '../../services/projectImageService';
import './AdminProjectFormPage.css';

// Slug helper function
function generateSlug(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminProjectFormPage({ mode = 'create' }) {
  const { id } = useParams();
  const navigate = useNavigate();

  // Basic Fields State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [slugStatus, setSlugStatus] = useState({ checking: false, available: true, message: '' });
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [location, setLocation] = useState('Delhi NCR');
  const [projectDate, setProjectDate] = useState('');

  // Settings State
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [displayOrder, setDisplayOrder] = useState(0);

  // Categories list
  const [categories, setCategories] = useState([]);

  // Images State
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]); // [{ id, file, previewUrl, altText, isCover }]
  const [imageIdsToDelete, setImageIdsToDelete] = useState([]);
  const [coverImageUrl, setCoverImageUrl] = useState(null);

  // UI / Status State
  const [isLoading, setIsLoading] = useState(mode === 'edit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // { current, total }
  const [generalError, setGeneralError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const fileInputRef = useRef(null);

  // 1. Fetch Categories for Dropdown (including inactive categories so existing projects can preserve their category)
  useEffect(() => {
    let isMounted = true;
    async function loadCats() {
      const { data } = await getCategories({ includeInactive: true });
      if (isMounted && Array.isArray(data)) {
        setCategories(data);
        if (mode === 'create' && data.length > 0) {
          const firstActive = data.find(c => c.is_active) || data[0];
          setCategoryId(firstActive.id);
        }
      }
    }
    loadCats();
    return () => { isMounted = false; };
  }, [mode]);

  // 2. Fetch Project Data if in Edit Mode
  useEffect(() => {
    if (mode !== 'edit' || !id) return;

    let isMounted = true;
    async function fetchProject() {
      setIsLoading(true);
      const { data, error } = await getAdminProjectById(id);

      if (!isMounted) return;

      if (error || !data) {
        setGeneralError(error?.message || 'Could not load project for editing.');
        setIsLoading(false);
        return;
      }

      setTitle(data.title || '');
      setSlug(data.slug || '');
      setSlugManuallyEdited(true);
      setDescription(data.description || '');
      setCategoryId(data.category_id || (data.category?.id || ''));
      setLocation(data.location || 'Delhi NCR');
      setProjectDate(data.project_date ? data.project_date.split('T')[0] : '');
      setIsPublished(Boolean(data.is_published));
      setIsFeatured(Boolean(data.is_featured));
      setDisplayOrder(data.display_order ?? 0);
      setCoverImageUrl(data.cover_image || null);

      if (Array.isArray(data.images)) {
        setExistingImages(
          data.images.map(img => ({
            id: img.id,
            imageUrl: resolveImageUrl(img.image_url),
            altText: img.alt_text || data.title,
            displayOrder: img.display_order ?? 0,
            isCover: Boolean(data.cover_image && (data.cover_image.includes(img.image_url) || img.image_url === data.cover_image))
          }))
        );
      }

      setIsLoading(false);
    }

    fetchProject();
    return () => { isMounted = false; };
  }, [mode, id]);

  // 3. Slug Generation on Title change (in create mode)
  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    if (fieldErrors.title) {
      setFieldErrors(prev => ({ ...prev, title: null }));
    }

    if (mode === 'create' && !slugManuallyEdited) {
      const generated = generateSlug(val);
      setSlug(generated);
      checkSlug(generated);
    }
  };

  const handleSlugChange = (e) => {
    setSlugManuallyEdited(true);
    const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(cleaned);
    if (fieldErrors.slug) {
      setFieldErrors(prev => ({ ...prev, slug: null }));
    }
  };

  const checkSlug = async (slugToCheck) => {
    if (!slugToCheck.trim()) {
      setSlugStatus({ checking: false, available: false, message: 'Slug is required.' });
      return;
    }

    setSlugStatus({ checking: true, available: true, message: 'Checking availability...' });
    const { isAvailable } = await checkSlugAvailability(slugToCheck, mode === 'edit' ? id : null);

    if (isAvailable) {
      setSlugStatus({ checking: false, available: true, message: '✓ Slug is available' });
    } else {
      setSlugStatus({ checking: false, available: false, message: '✕ Slug already taken by another project' });
    }
  };

  // 4. File Selection & Validation
  const handleFileSelect = (files) => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const newItems = [];
    const errors = [];

    fileList.forEach((file) => {
      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        errors.push(`"${file.name}": Unsupported format. Allowed: JPEG, PNG, WebP, SVG.`);
        return;
      }

      // Validate File Size (10MB limit)
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`"${file.name}": File size exceeds 10MB limit.`);
        return;
      }

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const previewUrl = URL.createObjectURL(file);

      newItems.push({
        id: tempId,
        file,
        previewUrl,
        altText: title || 'Interior design execution photograph',
        isCover: existingImages.length === 0 && newImageFiles.length === 0 && newItems.length === 0,
        displayOrder: existingImages.length + newImageFiles.length + newItems.length
      });
    });

    if (errors.length > 0) {
      setGeneralError(errors.join('\n'));
    } else {
      setGeneralError(null);
    }

    if (newItems.length > 0) {
      setNewImageFiles(prev => [...prev, ...newItems]);
      // If no cover image yet, set first as cover
      if (!coverImageUrl) {
        setCoverImageUrl(newItems[0].previewUrl);
      }
    }
  };

  // Media Library Multi-Selection
  const handleMediaPickerSelect = (selected) => {
    const items = Array.isArray(selected) ? selected : [selected];
    if (items.length === 0) {
      setShowMediaPicker(false);
      return;
    }

    const newItems = items.map((item, idx) => ({
      id: `media-lib-${item.id || Date.now()}-${idx}`,
      imageUrl: item.public_url,
      previewUrl: item.public_url,
      altText: item.alt_text || title || 'Interior design execution photograph',
      isCover: existingImages.length === 0 && newImageFiles.length === 0 && idx === 0,
      displayOrder: existingImages.length + newImageFiles.length + idx
    }));

    setNewImageFiles(prev => [...prev, ...newItems]);
    if (!coverImageUrl && newItems.length > 0) {
      setCoverImageUrl(newItems[0].imageUrl);
    }
    setShowMediaPicker(false);
  };

  // 5. Image Reordering
  const moveImage = (index, direction, isNewList) => {
    if (isNewList) {
      const list = [...newImageFiles];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= list.length) return;
      const [moved] = list.splice(index, 1);
      list.splice(targetIndex, 0, moved);
      setNewImageFiles(list.map((item, idx) => ({ ...item, displayOrder: idx })));
    } else {
      const list = [...existingImages];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= list.length) return;
      const [moved] = list.splice(index, 1);
      list.splice(targetIndex, 0, moved);
      setExistingImages(list.map((item, idx) => ({ ...item, displayOrder: idx })));
    }
  };

  // 6. Set Image as Primary Cover
  const setAsCover = (imgUrl) => {
    setCoverImageUrl(imgUrl);
    setExistingImages(prev => prev.map(img => ({
      ...img,
      isCover: img.imageUrl === imgUrl
    })));
    setNewImageFiles(prev => prev.map(img => ({
      ...img,
      isCover: img.previewUrl === imgUrl
    })));
  };

  // 7. Remove an image
  const removeImage = (targetId, isNewList) => {
    if (isNewList) {
      setNewImageFiles(prev => {
        const itemToRemove = prev.find(i => i.id === targetId);
        if (itemToRemove?.previewUrl && itemToRemove.file) {
          URL.revokeObjectURL(itemToRemove.previewUrl);
        }
        return prev.filter(i => i.id !== targetId);
      });
    } else {
      setImageIdsToDelete(prev => [...prev, targetId]);
      setExistingImages(prev => prev.filter(i => i.id !== targetId));
    }
  };

  // 8. Form Validation
  const validateForm = () => {
    const errs = {};
    if (!title.trim()) {
      errs.title = 'Project title is required.';
    }
    if (!slug.trim()) {
      errs.slug = 'Slug is required.';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
      errs.slug = 'Slug may only contain lowercase letters, numbers and hyphens.';
    }

    if (!categoryId) {
      errs.category = 'Please select a room category.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // 9. Submit Handler
  const handleSubmit = async (e, overridePublished = null) => {
    if (e) e.preventDefault();
    setGeneralError(null);

    if (!validateForm()) {
      setGeneralError('Please correct the highlighted form errors before saving.');
      return;
    }

    const effectivePublished = overridePublished !== null ? overridePublished : isPublished;

    setIsSubmitting(true);
    setUploadProgress(null);

    try {
      const projectPayload = {
        title: title.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim(),
        category_id: categoryId || null,
        location: location.trim() || 'Delhi NCR',
        project_date: projectDate || null,
        is_published: effectivePublished,
        is_featured: isFeatured,
        display_order: parseInt(displayOrder, 10) || 0
      };

      if (mode === 'create') {
        const imagePayload = newImageFiles.map((item, idx) => ({
          file: item.file || null,
          imageUrl: item.imageUrl || null,
          altText: item.altText || title.trim(),
          displayOrder: idx,
          isCover: item.isCover || item.previewUrl === coverImageUrl
        }));

        const { data, error } = await createProjectFull(
          projectPayload,
          imagePayload,
          (curr, tot) => setUploadProgress({ current: curr, total: tot })
        );

        if (error || !data) {
          throw new Error(error?.message || 'Failed to create project in database.');
        }

        navigate('/nimda-portal/projects', {
          state: {
            toast: `Project "${title}" created successfully ${effectivePublished ? 'and published' : 'as draft'}.`
          }
        });
      } else {
        // Edit Mode
        const newImagesToUpload = newImageFiles.map((item, idx) => ({
          file: item.file || null,
          imageUrl: item.imageUrl || null,
          altText: item.altText || title.trim(),
          displayOrder: existingImages.length + idx,
          isCover: item.isCover || item.previewUrl === coverImageUrl
        }));

        const { data, error } = await updateProjectFull(
          id,
          projectPayload,
          {
            existingImages,
            newImagesToUpload,
            imageIdsToDelete,
            coverImageUrl
          },
          (curr, tot) => setUploadProgress({ current: curr, total: tot })
        );

        if (error || !data) {
          throw new Error(error?.message || 'Failed to update project in database.');
        }

        navigate('/nimda-portal/projects', {
          state: {
            toast: `Project "${title}" updated successfully.`
          }
        });
      }
    } catch (err) {
      console.error('[AdminProjectFormPage] Save error:', err);
      setGeneralError(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  // 10. Delete Handler (Edit mode only)
  const handleDeleteConfirm = async () => {
    if (!id) return;
    setIsDeleting(true);

    const { success, error } = await deleteProjectFull(id);
    setIsDeleting(false);

    if (!success || error) {
      setGeneralError(error?.message || 'Failed to delete project.');
    } else {
      navigate('/nimda-portal/projects', {
        state: { toast: `Project "${title}" was permanently removed.` }
      });
    }
  };

  const pageTitle = mode === 'create' ? 'Add New Project' : `Edit: ${title || 'Project'}`;

  if (isLoading) {
    return (
      <AdminLayout pageTitle={pageTitle}>
        <div style={{ maxWidth: '800px', margin: '4rem auto', textAlign: 'center' }}>
          <RefreshCw size={36} className="animate-spin" color="var(--admin-accent)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--admin-primary)' }}>Loading Project Data...</h2>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle={pageTitle}>
      <div className="admin-form-container">
        {/* Top Header Bar */}
        <div className="form-header-bar">
          <div>
            <Link to="/nimda-portal/projects" className="form-back-link">
              <ArrowLeft size={15} />
              <span>Back to Projects</span>
            </Link>
            <div className="form-title-group">
              <h1 className="form-main-title">{pageTitle}</h1>
              <p className="form-sub-title">
                {mode === 'create'
                  ? 'Fill in project details and upload high-resolution photographs.'
                  : `Update specifications, gallery photos, and publishing status for ID: ${id}`}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {slug && (
              <Link
                to={`/projects/${slug}?preview=true`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ fontSize: '0.84rem', padding: '0.5rem 0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                title="Preview public project page"
              >
                <Eye size={14} />
                <span>Preview</span>
              </Link>
            )}

            <button
              type="button"
              onClick={(e) => handleSubmit(e)}
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ fontSize: '0.84rem', padding: '0.5rem 1.1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>{mode === 'create' ? 'Create Project' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {generalError && (
          <div role="alert" style={{
            background: 'rgba(220, 53, 69, 0.08)',
            border: '1px solid rgba(220, 53, 69, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <AlertCircle size={20} color="#dc3545" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.88rem', color: '#dc3545', fontWeight: 500, whiteSpace: 'pre-line' }}>
              {generalError}
            </span>
          </div>
        )}

        {/* Upload Progress Indicator */}
        {uploadProgress && (
          <div className="upload-progress-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, color: 'var(--admin-primary)' }}>
              <span>Uploading images to Supabase Storage...</span>
              <span>{uploadProgress.current} / {uploadProgress.total}</span>
            </div>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Main Form Form Body */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid-layout">
            {/* LEFT / MAIN COLUMN */}
            <div className="form-main-col">
              {/* Card 1: Basic Information */}
              <div className="form-card">
                <h2 className="form-card-title">
                  <FolderKanban size={18} color="var(--admin-accent)" />
                  <span>Basic Information</span>
                </h2>

                {/* Project Title */}
                <div className="form-field-group">
                  <label htmlFor="project-title" className="form-label">
                    <span>Project Title <span className="form-label-required">*</span></span>
                    <span className="form-hint">e.g. Modern Minimalist Residence</span>
                  </label>
                  <input
                    id="project-title"
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="Enter project name..."
                    className={`form-input ${fieldErrors.title ? 'has-error' : ''}`}
                    required
                  />
                  {fieldErrors.title && (
                    <span className="form-error-msg">{fieldErrors.title}</span>
                  )}
                </div>

                {/* Slug */}
                <div className="form-field-group">
                  <label htmlFor="project-slug" className="form-label">
                    <span>URL Slug <span className="form-label-required">*</span></span>
                    <span style={{
                      fontSize: '0.74rem',
                      color: slugStatus.available ? '#28a745' : '#dc3545',
                      fontWeight: 600
                    }}>
                      {slugStatus.message}
                    </span>
                  </label>
                  <div className={`slug-input-wrapper ${fieldErrors.slug ? 'has-error' : ''}`}>
                    <span className="slug-prefix">saifiinteriorhub.in/projects/</span>
                    <input
                      id="project-slug"
                      type="text"
                      value={slug}
                      onChange={handleSlugChange}
                      onBlur={() => checkSlug(slug)}
                      placeholder="modern-minimalist-residence"
                      className="slug-input"
                      required
                    />
                  </div>
                  {fieldErrors.slug && (
                    <span className="form-error-msg">{fieldErrors.slug}</span>
                  )}
                </div>

                {/* Category & Location Row */}
                <div className="form-row-2">
                  <div className="form-field-group">
                    <label htmlFor="project-category" className="form-label">
                      <span>Room Category <span className="form-label-required">*</span></span>
                    </label>
                    <select
                      id="project-category"
                      value={categoryId}
                      onChange={(e) => {
                        setCategoryId(e.target.value);
                        if (fieldErrors.category) {
                          setFieldErrors(prev => ({ ...prev, category: null }));
                        }
                      }}
                      className={`form-select ${fieldErrors.category ? 'has-error' : ''}`}
                    >
                      <option value="">Select Category...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {!c.is_active ? '(Inactive)' : ''}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.category && (
                      <span className="form-error-msg">{fieldErrors.category}</span>
                    )}
                  </div>

                  <div className="form-field-group">
                    <label htmlFor="project-location" className="form-label">
                      <span>Location</span>
                    </label>
                    <input
                      id="project-location"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Greater Kailash, New Delhi"
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Project Date & Order Row */}
                <div className="form-row-2">
                  <div className="form-field-group">
                    <label htmlFor="project-date" className="form-label">
                      <span>Project Completion Date</span>
                    </label>
                    <input
                      id="project-date"
                      type="date"
                      value={projectDate}
                      onChange={(e) => setProjectDate(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-field-group">
                    <label htmlFor="project-order" className="form-label">
                      <span>Display Order</span>
                      <span className="form-hint">Lower numbers display first</span>
                    </label>
                    <input
                      id="project-order"
                      type="number"
                      min="0"
                      value={displayOrder}
                      onChange={(e) => setDisplayOrder(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="form-field-group">
                  <label htmlFor="project-description" className="form-label">
                    <span>Project Narrative & Scope Description</span>
                    <span className="form-hint">{description.length} characters</span>
                  </label>
                  <textarea
                    id="project-description"
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe design concepts, material palettes (teak, quartz, acrylic), execution challenges, client requirements, and finished aesthetic..."
                    className="form-textarea"
                  />
                </div>
              </div>

              {/* Card 2: Image Management & Supabase Storage */}
              <div className="form-card">
                <h2 className="form-card-title">
                  <ImageIcon size={18} color="var(--admin-accent)" />
                  <span>Project Gallery Images</span>
                </h2>

                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--color-text-muted)' }}>
                  Upload high-resolution photography to the Supabase <code>project-images</code> bucket. Set which photograph acts as the primary cover showcase.
                </p>

                {/* Dropzone */}
                <div
                  className="image-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFileSelect(e.dataTransfer.files);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                  aria-label="Upload project photographs"
                >
                  <div className="dropzone-icon-box" aria-hidden="true">
                    <UploadCloud size={24} />
                  </div>
                  <div className="dropzone-main-text">
                    Click to browse or drag & drop project photographs
                  </div>
                  <div className="dropzone-sub-text">
                    Supported: JPEG, PNG, WebP, SVG • Maximum file size: 10MB per image
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="dropzone-hidden-input"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.75rem', marginBottom: '1rem' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setShowMediaPicker(true)}
                  >
                    <ImageIcon size={15} style={{ marginRight: '0.35rem' }} />
                    Choose from Media Library
                  </button>
                </div>

                {/* Image Queue & Existing Images */}
                <div className="image-gallery-queue">
                  {/* 1. Existing Saved Images */}
                  {existingImages.map((img, idx) => (
                    <div
                      key={img.id}
                      className={`image-item-card ${img.isCover || img.imageUrl === coverImageUrl ? 'is-cover' : ''}`}
                    >
                      <img
                        src={img.imageUrl}
                        alt={img.altText || 'Project photo'}
                        className="image-item-thumb"
                        onError={(e) => {
                          e.currentTarget.src = '/projects/project-1.jpg';
                        }}
                      />

                      <div className="image-item-details">
                        <div className="image-item-meta">
                          <span style={{ fontWeight: 600 }}>Image #{idx + 1} (Saved)</span>
                          {(img.isCover || img.imageUrl === coverImageUrl) && (
                            <span className="image-cover-badge">★ Primary Cover</span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={img.altText}
                          onChange={(e) => {
                            const val = e.target.value;
                            setExistingImages(prev =>
                              prev.map(i => i.id === img.id ? { ...i, altText: val } : i)
                            );
                          }}
                          placeholder="Alt description for SEO & accessibility..."
                          className="image-alt-input"
                          aria-label={`Alt text for image ${idx + 1}`}
                        />
                      </div>

                      <div className="image-item-actions">
                        <button
                          type="button"
                          onClick={() => setAsCover(img.imageUrl)}
                          className="image-action-btn"
                          title="Set as primary cover photograph"
                          style={{ color: (img.isCover || img.imageUrl === coverImageUrl) ? 'var(--admin-accent)' : undefined }}
                        >
                          <Star size={14} fill={(img.isCover || img.imageUrl === coverImageUrl) ? 'var(--admin-accent)' : 'none'} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(idx, -1, false)}
                          disabled={idx === 0}
                          className="image-action-btn"
                          title="Move up"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(idx, 1, false)}
                          disabled={idx === existingImages.length - 1}
                          className="image-action-btn"
                          title="Move down"
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(img.id, false)}
                          className="image-action-btn btn-remove"
                          title="Remove image"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* 2. Newly Added Images Pending Upload */}
                  {newImageFiles.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`image-item-card ${item.isCover || item.previewUrl === coverImageUrl ? 'is-cover' : ''}`}
                    >
                      <img
                        src={item.previewUrl}
                        alt="Upload preview"
                        className="image-item-thumb"
                      />

                      <div className="image-item-details">
                        <div className="image-item-meta">
                          <span style={{ fontWeight: 600, color: 'var(--admin-accent)' }}>
                            New #{existingImages.length + idx + 1} ({item.file ? 'Queued for Upload' : 'Media Library'})
                          </span>
                          <span>• {item.file ? `${(item.file.size / (1024 * 1024)).toFixed(2)} MB` : 'In Storage'}</span>
                          {(item.isCover || item.previewUrl === coverImageUrl) && (
                            <span className="image-cover-badge">★ Primary Cover</span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={item.altText}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewImageFiles(prev =>
                              prev.map(i => i.id === item.id ? { ...i, altText: val } : i)
                            );
                          }}
                          placeholder="Alt description for SEO & accessibility..."
                          className="image-alt-input"
                          aria-label={`Alt text for queued image ${idx + 1}`}
                        />
                      </div>

                      <div className="image-item-actions">
                        <button
                          type="button"
                          onClick={() => setAsCover(item.previewUrl)}
                          className="image-action-btn"
                          title="Set as primary cover photograph"
                          style={{ color: (item.isCover || item.previewUrl === coverImageUrl) ? 'var(--admin-accent)' : undefined }}
                        >
                          <Star size={14} fill={(item.isCover || item.previewUrl === coverImageUrl) ? 'var(--admin-accent)' : 'none'} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(idx, -1, true)}
                          disabled={idx === 0}
                          className="image-action-btn"
                          title="Move up"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(idx, 1, true)}
                          disabled={idx === newImageFiles.length - 1}
                          className="image-action-btn"
                          title="Move down"
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(item.id, true)}
                          className="image-action-btn btn-remove"
                          title="Remove image"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {existingImages.length === 0 && newImageFiles.length === 0 && (
                    <div style={{
                      padding: '2rem 1rem',
                      textAlign: 'center',
                      background: 'var(--admin-bg)',
                      border: '1px dashed var(--admin-border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--color-text-muted)',
                      fontSize: '0.85rem'
                    }}>
                      No gallery photographs added yet. Drag images into the upload zone above.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT / SIDEBAR COLUMN */}
            <div className="form-side-col">
              {/* Settings Card: Publication Status */}
              <div className="form-card">
                <h2 className="form-card-title">
                  <CheckCircle2 size={17} color="var(--admin-accent)" />
                  <span>Publication Status</span>
                </h2>

                <div className="status-radio-group">
                  <label className={`status-radio-card ${isPublished ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="publishingStatus"
                      checked={isPublished}
                      onChange={() => setIsPublished(true)}
                    />
                    <div className="status-radio-label">
                      <span className="status-radio-title">● Published</span>
                      <span className="status-radio-sub">Visible to visitors on public website</span>
                    </div>
                  </label>

                  <label className={`status-radio-card ${!isPublished ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name="publishingStatus"
                      checked={!isPublished}
                      onChange={() => setIsPublished(false)}
                    />
                    <div className="status-radio-label">
                      <span className="status-radio-title">○ Draft</span>
                      <span className="status-radio-sub">Hidden from public; only visible to admin</span>
                    </div>
                  </label>
                </div>

                {/* Featured Highlight Checkbox */}
                <div
                  className="featured-toggle-box"
                  onClick={() => setIsFeatured(prev => !prev)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && setIsFeatured(prev => !prev)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Star
                      size={17}
                      color="var(--admin-accent)"
                      fill={isFeatured ? 'var(--admin-accent)' : 'none'}
                    />
                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--admin-primary)' }}>
                        Featured Portfolio
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                        Highlight in homepage showcase
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ cursor: 'pointer' }}
                  />
                </div>

                {/* Submission Action Buttons */}
                <div className="form-submit-actions">
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    disabled={isSubmitting}
                    className="btn-submit-main"
                  >
                    <Save size={16} />
                    <span>{mode === 'create' ? 'Publish Project' : 'Save & Publish'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, false)}
                    disabled={isSubmitting}
                    className="btn-submit-secondary"
                  >
                    <span>Save as Draft</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/nimda-portal/projects')}
                    disabled={isSubmitting}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      padding: '0.4rem',
                      textDecoration: 'underline'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Danger Zone: Delete Project (Edit mode only) */}
              {mode === 'edit' && (
                <div className="form-card" style={{ borderColor: 'rgba(220, 53, 69, 0.3)' }}>
                  <h2 className="form-card-title" style={{ color: '#dc3545' }}>
                    <Trash2 size={16} color="#dc3545" />
                    <span>Danger Zone</span>
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                    Permanently delete this project from database records and remove all uploaded assets from the Supabase Storage bucket.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="btn btn-outline"
                    style={{
                      color: '#dc3545',
                      borderColor: 'rgba(220, 53, 69, 0.4)',
                      fontSize: '0.84rem'
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Delete Project</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-card">
              <div className="modal-header">
                <div className="modal-danger-icon">
                  <Trash2 size={22} />
                </div>
                <div>
                  <h2 className="modal-title">Delete Project</h2>
                  <p className="modal-desc">
                    Are you sure you want to permanently delete <strong>{title}</strong>? This will purge all associated photos and database entries.
                  </p>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="btn btn-outline"
                  style={{ fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="btn btn-primary"
                  style={{
                    fontSize: '0.85rem',
                    background: '#dc3545',
                    borderColor: '#dc3545',
                    color: '#ffffff'
                  }}
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Media Picker Modal */}
        <MediaPickerModal
          isOpen={showMediaPicker}
          onClose={() => setShowMediaPicker(false)}
          onSelect={handleMediaPickerSelect}
          multiple={true}
          title="Select Project Gallery Images"
        />
      </div>
    </AdminLayout>
  );
}