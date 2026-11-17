import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import {
  UploadCloud,
  Search,
  Grid,
  List,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  X,
  FileImage,
  RotateCcw,
  Info
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  getMediaItems,
  getMediaStats,
  uploadMultipleMediaImages,
  updateMediaMetadata,
  deleteMediaItemSafe,
  replaceMediaImage,
  formatBytes,
  MEDIA_ALLOWED_MIME_TYPES
} from '../../services/mediaService';
import { MAX_FILE_SIZE_BYTES } from '../../services/projectImageService';
import { gsap, isReducedMotion } from '../../utils/gsapConfig';
import './AdminMediaLibraryPage.css';

export default function AdminMediaLibraryPage() {
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const replaceInputRef = useRef(null);

  // Filter & Search State
  const [search, setSearch] = useState('');
  const [bucketFilter, setBucketFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState('all');
  const [usageFilter, setUsageFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Data State
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({
    totalImages: 0,
    totalBytes: 0,
    projectImagesCount: 0,
    categoryImagesCount: 0,
    generalImagesCount: 0,
    inUseCount: 0,
    unusedCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Selected Item for Detail Drawer
  const [selectedItem, setSelectedItem] = useState(null);
  const [editAltText, setEditAltText] = useState('');
  const [isSavingAlt, setIsSavingAlt] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [naturalDimensions, setNaturalDimensions] = useState(null);

  // Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFolder, setUploadFolder] = useState('media/general');
  const [uploadTargetBucket, setUploadTargetBucket] = useState('project-images');
  const [queuedFiles, setQueuedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // { current, total, name }

  // Safe Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Replace Image State
  const [isReplacing, setIsReplacing] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3800);
  };

  // 1. Fetch Media Items and Stats
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [itemsRes, statsRes] = await Promise.all([
          getMediaItems({
            search,
            bucket: bucketFilter,
            format: formatFilter,
            usage: usageFilter,
            sortBy
          }),
          getMediaStats()
        ]);

        if (!isMounted) return;

        if (itemsRes.error && !itemsRes.data) throw itemsRes.error;

        setItems(itemsRes.data || []);
        setStats(statsRes);
        setFetchError(null);
      } catch (err) {
        if (!isMounted) return;
        console.error('[AdminMediaLibraryPage] Error loading media:', err);
        setFetchError(err.message || 'Failed to load media assets.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [search, bucketFilter, formatFilter, usageFilter, sortBy, reloadTrigger]);

  // Entrance animations
  useGSAP(() => {
    if (isReducedMotion() || isLoading) return;

    gsap.from('.media-header-card, .media-stats-strip, .media-toolbar', {
      y: 18,
      opacity: 0,
      duration: 0.45,
      stagger: 0.08,
      ease: 'power3.out'
    });
  }, { scope: containerRef, dependencies: [isLoading] });

  // Open Detail Drawer
  const handleSelectImage = (item) => {
    setSelectedItem(item);
    setEditAltText(item.altText || '');
    setCopiedUrl(false);
    setNaturalDimensions(null);

    // Compute dimensions dynamically
    const img = new Image();
    img.src = item.url;
    img.onload = () => {
      setNaturalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
  };

  // Copy URL to Clipboard
  const handleCopyUrl = (url) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    showToast('Public image URL copied to clipboard!');
    setTimeout(() => setCopiedUrl(false), 2400);
  };

  // Save Alt Text Metadata
  const handleSaveAltText = async () => {
    if (!selectedItem) return;
    setIsSavingAlt(true);

    const { success, error } = await updateMediaMetadata(selectedItem, { altText: editAltText });
    setIsSavingAlt(false);

    if (!success || error) {
      showToast(error?.message || 'Failed to update metadata.', 'error');
    } else {
      showToast('Image Alt Text updated successfully.');
      setSelectedItem(prev => ({ ...prev, altText: editAltText }));
      setItems(prev => prev.map(i => i.id === selectedItem.id ? { ...i, altText: editAltText } : i));
    }
  };

  // Trigger Safe Delete
  const handleOpenDelete = (item, e) => {
    if (e) e.stopPropagation();
    setDeleteTarget(item);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    // Safety check: block if in use
    if (deleteTarget.isUsed || (deleteTarget.usages && deleteTarget.usages.length > 0)) {
      showToast(
        `Cannot delete: Image is currently active in "${deleteTarget.usages[0].title}".`,
        'error'
      );
      return;
    }

    setIsDeleting(true);
    const { success, error } = await deleteMediaItemSafe(deleteTarget);
    setIsDeleting(false);

    if (!success || error) {
      showToast(error?.message || 'Failed to delete image.', 'error');
    } else {
      showToast(`"${deleteTarget.name}" was permanently removed.`);
      if (selectedItem?.id === deleteTarget.id) {
        setSelectedItem(null);
      }
      setDeleteTarget(null);
      setIsLoading(true);
      setReloadTrigger(prev => prev + 1);
    }
  };

  // File Queue Handler for Upload Modal
  const handleQueueFiles = (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    const valid = [];
    const errors = [];

    fileList.forEach(file => {
      if (!MEDIA_ALLOWED_MIME_TYPES.includes(file.type)) {
        errors.push(`"${file.name}": Unsupported format.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`"${file.name}": Exceeds 10MB limit.`);
        return;
      }
      valid.push({
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        size: file.size
      });
    });

    if (errors.length > 0) {
      showToast(errors.join(', '), 'error');
    }

    if (valid.length > 0) {
      setQueuedFiles(prev => [...prev, ...valid]);
    }
  };

  // Execute Upload
  const handleExecuteUpload = async () => {
    if (queuedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress({ current: 0, total: queuedFiles.length, name: '' });

    const rawFiles = queuedFiles.map(q => q.file);
    const { uploaded, failed } = await uploadMultipleMediaImages(
      rawFiles,
      { folder: uploadFolder, bucket: uploadTargetBucket },
      (curr, tot, name) => setUploadProgress({ current: curr, total: tot, name })
    );

    setIsUploading(false);
    setUploadProgress(null);

    // Clean up previews
    queuedFiles.forEach(q => URL.revokeObjectURL(q.previewUrl));
    setQueuedFiles([]);
    setUploadModalOpen(false);

    if (failed.length > 0) {
      showToast(`Uploaded ${uploaded.length} images. ${failed.length} failed.`, 'error');
    } else {
      showToast(`Successfully uploaded ${uploaded.length} image${uploaded.length > 1 ? 's' : ''}!`);
    }

    setIsLoading(true);
    setReloadTrigger(prev => prev + 1);
  };

  // Replace Image Handler
  const handleTriggerReplace = (e) => {
    if (e) e.stopPropagation();
    replaceInputRef.current?.click();
  };

  const handleExecuteReplace = async (file) => {
    if (!file || !selectedItem) return;

    if (!MEDIA_ALLOWED_MIME_TYPES.includes(file.type)) {
      showToast('Unsupported replacement file format.', 'error');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      showToast('File size exceeds 10MB limit.', 'error');
      return;
    }

    setIsReplacing(true);
    const { success, newItem, error } = await replaceMediaImage(selectedItem, file);
    setIsReplacing(false);

    if (!success || error || !newItem) {
      showToast(error?.message || 'Failed to replace image.', 'error');
    } else {
      showToast(`Successfully replaced "${selectedItem.name}". Content references updated!`);
      setSelectedItem(newItem);
      setIsLoading(true);
      setReloadTrigger(prev => prev + 1);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setBucketFilter('all');
    setFormatFilter('all');
    setUsageFilter('all');
    setSortBy('newest');
    setIsLoading(true);
    setReloadTrigger(prev => prev + 1);
  };

  const isFiltered = search || bucketFilter !== 'all' || formatFilter !== 'all' || usageFilter !== 'all' || sortBy !== 'newest';

  return (
    <AdminLayout pageTitle="Media Library">
      <div ref={containerRef} className="admin-media-container">
        {/* Hidden Replace Input */}
        <input
          ref={replaceInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml,image/avif"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleExecuteReplace(e.target.files[0]);
            }
          }}
        />

        {/* 1. TOP HEADER */}
        <section className="media-header-card" aria-label="Media library header">
          <div>
            <h1 className="media-header-title">Media Library</h1>
            <p className="media-header-sub">
              Manage all your website images, project photography, and category covers in one place.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                setReloadTrigger(prev => prev + 1);
              }}
              className="btn btn-outline"
              style={{ fontSize: '0.84rem', padding: '0.55rem 0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#ffffff' }}
              title="Refresh media list"
              disabled={isLoading}
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => setUploadModalOpen(true)}
              className="media-upload-trigger-btn"
            >
              <UploadCloud size={18} />
              <span>Upload Images</span>
            </button>
          </div>
        </section>

        {/* 2. STATS USAGE STRIP */}
        <section className="media-stats-strip" aria-label="Media library storage statistics">
          <div className="media-stat-box">
            <span className="media-stat-label">Total Assets</span>
            <span className="media-stat-val">{stats.totalImages}</span>
          </div>

          <div className="media-stat-box">
            <span className="media-stat-label">Storage Used</span>
            <span className="media-stat-val" style={{ color: 'var(--admin-accent)' }}>
              {stats.totalBytes > 0 ? formatBytes(stats.totalBytes) : 'CDN Hosted'}
            </span>
          </div>

          <div className="media-stat-box">
            <span className="media-stat-label">In-Use Content</span>
            <span className="media-stat-val" style={{ color: '#28a745' }}>
              {stats.inUseCount}
            </span>
          </div>

          <div className="media-stat-box">
            <span className="media-stat-label">Unused Assets</span>
            <span className="media-stat-val" style={{ color: '#6c757d' }}>
              {stats.unusedCount}
            </span>
          </div>
        </section>

        {/* 3. TOOLBAR: SEARCH, FILTERS, SORTS & VIEW TOGGLE */}
        <section className="media-toolbar" aria-label="Media toolbar">
          <div className="media-search-box">
            <Search size={16} className="media-search-icon" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by filename, alt text, or usage title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="media-search-input"
              aria-label="Search media files"
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

          <div className="media-filters-group">
            {/* Folder / Bucket Filter */}
            <select
              value={bucketFilter}
              onChange={(e) => setBucketFilter(e.target.value)}
              className="media-select"
              aria-label="Filter by storage bucket"
            >
              <option value="all">All Buckets</option>
              <option value="project-images">Project Images</option>
              <option value="category-images">Category Images</option>
            </select>

            {/* Format Filter */}
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="media-select"
              aria-label="Filter by image format"
            >
              <option value="all">All Formats</option>
              <option value="webp">WebP</option>
              <option value="jpg">JPG / JPEG</option>
              <option value="png">PNG</option>
              <option value="svg">SVG</option>
              <option value="avif">AVIF</option>
            </select>

            {/* Usage Filter */}
            <select
              value={usageFilter}
              onChange={(e) => setUsageFilter(e.target.value)}
              className="media-select"
              aria-label="Filter by usage status"
            >
              <option value="all">All Usages</option>
              <option value="in_use">In-Use Only</option>
              <option value="unused">Unused (Safe to Delete)</option>
              <option value="projects">Used in Projects</option>
              <option value="categories">Used in Categories</option>
            </select>

            {/* Sorting */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="media-select"
              aria-label="Sort media assets"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Filename (A–Z)</option>
              <option value="largest">Largest File</option>
              <option value="smallest">Smallest File</option>
            </select>

            {/* View Mode Toggle */}
            <div className="media-view-toggle">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`media-toggle-btn ${viewMode === 'grid' ? 'is-active' : ''}`}
                title="Grid view"
                aria-label="Grid view"
              >
                <Grid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`media-toggle-btn ${viewMode === 'list' ? 'is-active' : ''}`}
                title="List view"
                aria-label="List view"
              >
                <List size={15} />
              </button>
            </div>

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

        {/* 5. MEDIA CONTENT (GRID OR LIST) */}
        {isLoading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1.25rem',
            padding: '1rem 0'
          }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer" style={{ height: '180px', borderRadius: '4px' }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div style={{
            padding: '4rem 1.5rem',
            textAlign: 'center',
            background: 'var(--admin-card-bg)',
            border: '1px solid var(--admin-border)',
            borderRadius: 'var(--radius-md)'
          }}>
            <FileImage size={40} color="var(--admin-accent)" style={{ marginBottom: '0.75rem' }} />
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--admin-primary)', margin: '0 0 0.35rem 0' }}>
              No Media Assets Found
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', maxWidth: '440px', margin: '0 auto 1.25rem auto' }}>
              {isFiltered
                ? 'No media files match your active search or filter criteria. Try resetting your filters.'
                : 'Your media library currently has no uploaded assets. Upload photographs to get started.'}
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
              <button
                type="button"
                onClick={() => setUploadModalOpen(true)}
                className="media-upload-trigger-btn"
              >
                <UploadCloud size={16} />
                <span>Upload Your First Image</span>
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="media-grid">
            {items.map((item) => (
              <div
                key={item.id}
                className={`media-card ${selectedItem?.id === item.id ? 'is-selected' : ''}`}
                onClick={() => handleSelectImage(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelectImage(item)}
                aria-label={`View details for ${item.name}`}
              >
                <div className="media-thumb-frame">
                  <img
                    src={item.url}
                    alt={item.altText || item.name}
                    className="media-card-img"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = '/projects/project-1.jpg';
                    }}
                  />

                  <div className="media-badges-overlay">
                    <span className="media-format-badge">{item.format}</span>
                    <span className={`media-usage-badge ${item.isUsed ? 'in-use' : 'unused'}`}>
                      {item.isUsed ? 'In Use' : 'Unused'}
                    </span>
                  </div>
                </div>

                <div className="media-card-meta">
                  <span className="media-card-name" title={item.name}>
                    {item.name}
                  </span>
                  <div className="media-card-subline">
                    <span>{item.size ? formatBytes(item.size) : 'Optimized'}</span>
                    <span>{item.bucket === 'category-images' ? 'Category' : 'Project'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="media-table-card">
            <div className="media-table-scroll">
              <table className="media-table">
                <thead>
                  <tr>
                    <th scope="col" style={{ width: '38%' }}>File Details</th>
                    <th scope="col">Bucket / Folder</th>
                    <th scope="col">Format</th>
                    <th scope="col">Size</th>
                    <th scope="col">Usage Status</th>
                    <th scope="col">Date</th>
                    <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} onClick={() => handleSelectImage(item)}>
                      <td>
                        <div className="media-row-item">
                          <img
                            src={item.url}
                            alt=""
                            className="media-row-thumb"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.src = '/projects/project-1.jpg';
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--admin-primary)', fontSize: '0.86rem' }}>
                              {item.name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                              {item.altText || 'No alt text'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text)' }}>
                          {item.bucket || 'project-images'}
                        </span>
                      </td>

                      <td>
                        <span className="media-format-badge" style={{ position: 'static' }}>
                          {item.format}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                          {item.size ? formatBytes(item.size) : '—'}
                        </span>
                      </td>

                      <td>
                        <span className={`status-badge ${item.isUsed ? 'published' : 'draft'}`}>
                          {item.isUsed ? `● In Use (${item.usages.length})` : '○ Unused'}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-light)' }}>
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => handleCopyUrl(item.url)}
                            className="action-icon-btn"
                            title="Copy public URL"
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleOpenDelete(item, e)}
                            className="action-icon-btn btn-delete"
                            title="Delete image"
                            disabled={item.isUsed}
                            style={{ opacity: item.isUsed ? 0.35 : 1 }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. DETAIL DRAWER (SLIDE-OVER PANEL) */}
        {selectedItem && (
          <div className="media-drawer-overlay" onClick={() => setSelectedItem(null)}>
            <div className="media-drawer-content" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-header">
                <h2 className="drawer-title">Image Details</h2>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="drawer-close-btn"
                  aria-label="Close drawer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="drawer-body">
                {/* Image High-res Preview */}
                <div className="drawer-image-preview-frame">
                  <img
                    src={selectedItem.url}
                    alt={selectedItem.altText || selectedItem.name}
                    className="drawer-preview-img"
                  />
                </div>

                {/* Public URL Box with Copy Button */}
                <div className="form-field-group">
                  <label className="form-label">
                    <span>Public Image URL</span>
                    {copiedUrl && (
                      <span style={{ color: '#28a745', fontSize: '0.75rem', fontWeight: 600 }}>
                        ✓ Copied to clipboard!
                      </span>
                    )}
                  </label>
                  <div className="url-copy-box">
                    <input
                      type="text"
                      readOnly
                      value={selectedItem.url}
                      className="url-copy-input"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(selectedItem.url)}
                      className="url-copy-btn"
                    >
                      {copiedUrl ? <Check size={14} /> : <Copy size={14} />}
                      <span>Copy</span>
                    </button>
                  </div>
                </div>

                {/* Specs Grid */}
                <div className="drawer-specs-grid">
                  <div className="spec-item">
                    <span className="spec-label">Filename</span>
                    <span className="spec-val" title={selectedItem.name}>{selectedItem.name}</span>
                  </div>

                  <div className="spec-item">
                    <span className="spec-label">Format / Type</span>
                    <span className="spec-val">{selectedItem.format.toUpperCase()}</span>
                  </div>

                  <div className="spec-item">
                    <span className="spec-label">File Size</span>
                    <span className="spec-val">
                      {selectedItem.size ? formatBytes(selectedItem.size) : 'Optimized CDN'}
                    </span>
                  </div>

                  <div className="spec-item">
                    <span className="spec-label">Dimensions</span>
                    <span className="spec-val">
                      {naturalDimensions ? `${naturalDimensions.width} × ${naturalDimensions.height} px` : 'Loading...'}
                    </span>
                  </div>

                  <div className="spec-item">
                    <span className="spec-label">Storage Bucket</span>
                    <span className="spec-val">{selectedItem.bucket || 'project-images'}</span>
                  </div>

                  <div className="spec-item">
                    <span className="spec-label">Uploaded</span>
                    <span className="spec-val">
                      {selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Portfolio Initial'}
                    </span>
                  </div>
                </div>

                {/* Editable Alt Text Section */}
                <div className="form-field-group">
                  <label htmlFor="edit-alt-text" className="form-label">
                    <span>Image Alt Text & Description</span>
                    <span className="form-hint">Used for SEO & accessibility</span>
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      id="edit-alt-text"
                      type="text"
                      value={editAltText}
                      onChange={(e) => setEditAltText(e.target.value)}
                      placeholder="Describe this image for screen readers..."
                      className="form-input"
                    />
                    <button
                      type="button"
                      onClick={handleSaveAltText}
                      disabled={isSavingAlt || editAltText === selectedItem.altText}
                      className="btn btn-primary"
                      style={{ fontSize: '0.82rem', padding: '0.55rem 0.85rem', whiteSpace: 'nowrap' }}
                    >
                      {isSavingAlt ? <RefreshCw size={12} className="animate-spin" /> : 'Save'}
                    </button>
                  </div>
                </div>

                {/* Real Usage References Card */}
                <div className="usage-references-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--admin-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Info size={15} color="var(--admin-accent)" />
                      <span>Tracked Content Usages ({selectedItem.usages?.length || 0})</span>
                    </span>
                    <span className={`status-badge ${selectedItem.isUsed ? 'published' : 'draft'}`}>
                      {selectedItem.isUsed ? 'In-Use' : 'Unused Asset'}
                    </span>
                  </div>

                  {selectedItem.usages && selectedItem.usages.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {selectedItem.usages.map((u, idx) => (
                        <div key={idx} className="usage-ref-item">
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--admin-primary)' }}>
                              {u.title}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                              Type: {u.type === 'project_cover' ? 'Primary Project Cover' : u.type === 'category_cover' ? 'Category Cover Photo' : 'Gallery Photograph'}
                            </div>
                          </div>

                          <Link
                            to={u.url}
                            className="btn btn-outline"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#ffffff' }}
                          >
                            <span>Edit</span>
                            <ExternalLink size={11} />
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#28a745', lineHeight: 1.5 }}>
                      ✓ This asset is not referenced by any project or category. It is safe to remove.
                    </p>
                  )}
                </div>

                {/* Action Buttons: Replace & Delete */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleTriggerReplace}
                    disabled={isReplacing}
                    className="btn btn-outline"
                    style={{ width: '100%', padding: '0.65rem', fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    <RefreshCw size={14} className={isReplacing ? 'animate-spin' : ''} />
                    <span>{isReplacing ? 'Replacing Image File...' : 'Replace Image File'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenDelete(selectedItem)}
                    disabled={selectedItem.isUsed}
                    className="btn btn-outline"
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      fontSize: '0.86rem',
                      color: selectedItem.isUsed ? 'var(--color-text-light)' : '#dc3545',
                      borderColor: selectedItem.isUsed ? 'var(--admin-border)' : 'rgba(220, 53, 69, 0.4)',
                      opacity: selectedItem.isUsed ? 0.5 : 1,
                      cursor: selectedItem.isUsed ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem'
                    }}
                    title={selectedItem.isUsed ? 'Cannot delete: Image is currently active in website content.' : 'Delete this image'}
                  >
                    <Trash2 size={14} />
                    <span>{selectedItem.isUsed ? 'Delete Blocked (In Use)' : 'Delete Unused Asset'}</span>
                  </button>

                  {selectedItem.isUsed && (
                    <span style={{ fontSize: '0.72rem', color: '#dc3545', textAlign: 'center' }}>
                      ⚠️ To delete this image, first remove or replace it in its referenced project/category.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. UPLOAD MODAL */}
        {uploadModalOpen && (
          <div className="upload-modal-overlay" role="dialog" aria-modal="true">
            <div className="upload-modal-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--admin-primary)', margin: 0 }}>
                  Upload Images to Media Library
                </h2>
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="drawer-close-btn"
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-field-group">
                  <label className="form-label"><span>Target Bucket</span></label>
                  <select
                    value={uploadTargetBucket}
                    onChange={(e) => setUploadTargetBucket(e.target.value)}
                    className="form-select"
                  >
                    <option value="project-images">project-images (Portfolio & General)</option>
                    <option value="category-images">category-images (Room Categories)</option>
                  </select>
                </div>

                <div className="form-field-group">
                  <label className="form-label"><span>Folder Organization</span></label>
                  <select
                    value={uploadFolder}
                    onChange={(e) => setUploadFolder(e.target.value)}
                    className="form-select"
                  >
                    <option value="media/general">media/general/</option>
                    <option value="media/projects">media/projects/</option>
                    <option value="media/categories">media/categories/</option>
                  </select>
                </div>
              </div>

              {/* Dropzone */}
              <div
                className="image-dropzone"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleQueueFiles(e.dataTransfer.files);
                }}
                role="button"
                tabIndex={0}
              >
                <div className="dropzone-icon-box" aria-hidden="true">
                  <UploadCloud size={24} />
                </div>
                <div className="dropzone-main-text">
                  Click to browse or drag & drop image files
                </div>
                <div className="dropzone-sub-text">
                  Supported: JPG, PNG, WebP, SVG, AVIF • Maximum file size: 10MB per file
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/svg+xml,image/avif"
                  onChange={(e) => handleQueueFiles(e.target.files)}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Upload Queue List */}
              {queuedFiles.length > 0 && (
                <div className="upload-queue-list">
                  {queuedFiles.map((q, idx) => (
                    <div key={idx} className="queue-item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <img src={q.previewUrl} alt="" style={{ width: '32px', height: '24px', objectFit: 'cover', borderRadius: '2px' }} />
                        <span style={{ fontWeight: 600, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {q.name}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                          ({formatBytes(q.size)})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          URL.revokeObjectURL(q.previewUrl);
                          setQueuedFiles(prev => prev.filter((_, i) => i !== idx));
                        }}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc3545' }}
                        title="Remove from queue"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Progress Bar */}
              {uploadProgress && (
                <div className="upload-progress-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                    <span>Uploading: {uploadProgress.name}...</span>
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    queuedFiles.forEach(q => URL.revokeObjectURL(q.previewUrl));
                    setQueuedFiles([]);
                    setUploadModalOpen(false);
                  }}
                  disabled={isUploading}
                  className="btn btn-outline"
                  style={{ fontSize: '0.85rem' }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleExecuteUpload}
                  disabled={isUploading || queuedFiles.length === 0}
                  className="btn btn-primary"
                  style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {isUploading ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Uploading {queuedFiles.length} files...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={14} />
                      <span>Upload {queuedFiles.length} Images</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 8. SAFE DELETE CONFIRMATION MODAL */}
        {deleteTarget && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-card">
              <div className="modal-header">
                <div className="modal-danger-icon">
                  <Trash2 size={22} />
                </div>
                <div>
                  <h2 className="modal-title">Delete Image Asset</h2>
                  <p className="modal-desc">
                    Are you sure you want to permanently delete this photograph from storage?
                  </p>
                </div>
              </div>

              <div className="modal-target-box">
                <img
                  src={deleteTarget.url}
                  alt=""
                  className="modal-target-thumb"
                  onError={(e) => {
                    e.currentTarget.src = '/projects/project-1.jpg';
                  }}
                />
                <div>
                  <div className="modal-target-title">{deleteTarget.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    Format: {deleteTarget.format.toUpperCase()} • {deleteTarget.size ? formatBytes(deleteTarget.size) : 'CDN Hosted'}
                  </div>
                </div>
              </div>

              {deleteTarget.isUsed ? (
                <div style={{ background: 'rgba(220, 53, 69, 0.08)', padding: '0.75rem', borderRadius: '4px', fontSize: '0.82rem', color: '#dc3545', lineHeight: 1.5 }}>
                  ⛔ <strong>Deletion Blocked:</strong> This image is currently referenced in:
                  <ul style={{ margin: '0.35rem 0 0 1rem', padding: 0 }}>
                    {deleteTarget.usages.map((u, i) => (
                      <li key={i}>{u.title} ({u.type})</li>
                    ))}
                  </ul>
                  You must reassign or remove this photograph from that content before it can be deleted.
                </div>
              ) : (
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
                  This photograph is confirmed unused across all website projects and categories. Deleting it will permanently purge the object from the Supabase Storage bucket.
                </p>
              )}

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
                  disabled={isDeleting || deleteTarget.isUsed}
                  className="btn btn-primary"
                  style={{
                    fontSize: '0.85rem',
                    background: deleteTarget.isUsed ? '#6c757d' : '#dc3545',
                    borderColor: deleteTarget.isUsed ? '#6c757d' : '#dc3545',
                    cursor: deleteTarget.isUsed ? 'not-allowed' : 'pointer',
                    color: '#ffffff'
                  }}
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 9. TOAST NOTIFICATION */}
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