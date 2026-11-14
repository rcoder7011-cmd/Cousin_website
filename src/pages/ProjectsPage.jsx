import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { AlertCircle, X, Award, Eye } from 'lucide-react';
import WhatsAppIcon from '../components/common/WhatsAppIcon';
import { PROJECT_PHOTOS, PROJECT_CATEGORIES } from '../data/projects';
import { getWhatsAppUrl } from '../data/designer';
import './ProjectsPage.css';

// In-memory set of image sources that have already loaded during the browser session.
// Prevents images from re-fading or flickering when switching categories or returning to the page.
const loadedImagesCache = new Set();

function ProjectImage({ photo, priority, onError }) {
  const [isLoaded, setIsLoaded] = useState(() => loadedImagesCache.has(photo.src));
  const imgRef = useRef(null);

  useLayoutEffect(() => {
    // If image is already cached or completed by the browser, mark it loaded immediately before paint
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      loadedImagesCache.add(photo.src);
      setIsLoaded(true);
    }
  }, [photo.src]);

  const handleLoad = () => {
    loadedImagesCache.add(photo.src);
    setIsLoaded(true);
  };

  return (
    <img
      ref={imgRef}
      src={photo.src}
      alt={photo.alt}
      width={photo.width}
      height={photo.height}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      onLoad={handleLoad}
      onError={onError}
      className={`portfolio-card-img ${isLoaded ? 'is-loaded' : ''}`}
    />
  );
}

export default function ProjectsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All Projects");
  const [failedImages, setFailedImages] = useState(new Set());
  const [activePhoto, setActivePhoto] = useState(null);
  const filterToolbarRef = useRef(null);
  const galleryContainerRef = useRef(null);

  const filteredPhotos = (selectedCategory === "All Projects" || selectedCategory === "All")
    ? PROJECT_PHOTOS
    : PROJECT_PHOTOS.filter(photo => photo.category.toLowerCase() === selectedCategory.toLowerCase());

  const handleCategoryChange = (category) => {
    if (category === selectedCategory) return;

    setSelectedCategory(category);

    // Scroll smoothly to gallery top positioned below sticky header
    if (galleryContainerRef.current) {
      const navbar = document.querySelector('.site-header');
      const navbarHeight = navbar ? navbar.offsetHeight : 76;
      const filterBar = filterToolbarRef.current;
      const filterHeight = filterBar ? filterBar.offsetHeight : 56;
      const stickyOffset = navbarHeight + filterHeight;

      const elementTop = galleryContainerRef.current.getBoundingClientRect().top + window.scrollY;
      const targetScrollY = Math.max(0, elementTop - stickyOffset - 12);

      window.scrollTo({
        top: targetScrollY,
        behavior: 'smooth'
      });
    }
  };

  const handleImageError = (id, src) => {
    console.error(`[Project Gallery] Image failed to load at path: ${src}`);
    setFailedImages(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  // Lock background scroll and listen for Escape key when lightbox is open
  useEffect(() => {
    if (!activePhoto) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActivePhoto(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activePhoto]);

  // Compute active photo index for lightbox counter
  const activeIndex = activePhoto ? filteredPhotos.findIndex(p => p.id === activePhoto.id) : -1;

  return (
    <div className="projects-page">
      {/* Header Banner */}
      <section className="page-header-wrapper" aria-label="Portfolio header">
        <div className="container">
          <div className="page-header-inner">
            <span className="badge">
              <Award size={14} className="badge-icon" />
              <span>Saifi Interior Hub • 10+ Years Experience</span>
            </span>
            <h1 className="page-main-title">Completed Interior Work Portfolio</h1>
            <p className="page-main-desc">
              Explore 100+ real site photographs directly supervised and executed by Saifi Interior Hub across Gurugram, Delhi, and Noida (saifiinteriorhub.in). Every project represents genuine craftsmanship by our in-house trade specialists.
            </p>
          </div>
        </div>
      </section>

      {/* Sticky Category Filter Toolbar */}
      <div ref={filterToolbarRef} className="projects-sticky-filter" aria-label="Category filter toolbar">
        <div className="container">
          <div className="category-filter-bar" role="tablist" aria-label="Filter projects by category">
            {PROJECT_CATEGORIES.map(category => (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={selectedCategory === category}
                onClick={() => handleCategoryChange(category)}
                className={`category-filter-btn ${selectedCategory === category ? 'is-active' : ''}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div ref={galleryContainerRef} className="container">
        {/* Gallery Status Header */}
        <div className="portfolio-gallery-header">
          <p className="portfolio-count-text">
            Displaying <strong>{filteredPhotos.length}</strong> {selectedCategory === "All Projects" ? "verified execution photographs" : `${selectedCategory} installations`}
          </p>
        </div>

        {/* Gallery Masonry Grid */}
        <div className="portfolio-grid" aria-label="Projects photographs gallery">
          {filteredPhotos.map((photo, index) => {
            const isFailed = failedImages.has(photo.id);
            const isPriority = index < 6;
            const photoTitle = `${photo.category} Execution #${String(index + 1).padStart(2, '0')}`;
            const enquiryUrl = getWhatsAppUrl(
              `Hi Saifi Interior Hub, I saw your ${photo.category} interior work (${photo.src}) on saifiinteriorhub.in and would like similar execution for my space.`
            );

            return (
              <article key={photo.id} className="portfolio-card">
                <div
                  className="portfolio-card-media"
                  style={photo.width && photo.height ? { aspectRatio: `${photo.width} / ${photo.height}` } : undefined}
                  onClick={() => !isFailed && setActivePhoto(photo)}
                  role={!isFailed ? "button" : undefined}
                  tabIndex={!isFailed ? 0 : undefined}
                  onKeyDown={!isFailed ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActivePhoto(photo);
                    }
                  } : undefined}
                  aria-label={!isFailed ? `View enlarged ${photo.category} photograph` : undefined}
                >
                  {isFailed ? (
                    <div className="portfolio-image-error" role="alert">
                      <AlertCircle size={26} className="portfolio-error-icon" aria-hidden="true" />
                      <span className="portfolio-error-title">Image Unavailable</span>
                      <code className="portfolio-error-path">{photo.src}</code>
                    </div>
                  ) : (
                    <>
                      <ProjectImage
                        photo={photo}
                        priority={isPriority}
                        onError={() => handleImageError(photo.id, photo.src)}
                      />
                      <div className="portfolio-hover-overlay" aria-hidden="true">
                        <div className="portfolio-hover-icon">
                          <Eye size={20} />
                          <span>View Detail</span>
                        </div>
                      </div>
                    </>
                  )}
                  <span className="project-badge">{photo.category}</span>
                </div>

                <div className="portfolio-card-footer">
                  <div className="portfolio-card-meta">
                    <span className="portfolio-card-title">{photoTitle}</span>
                    <span className="portfolio-card-category">{photo.category}</span>
                  </div>

                  <a
                    href={enquiryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="portfolio-card-enquire-btn"
                    aria-label={`Enquire about this ${photo.category} work on WhatsApp`}
                    title="Enquire on WhatsApp"
                  >
                    <WhatsAppIcon size={15} />
                    <span>Enquire</span>
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Enlarged Image Lightbox Modal */}
      {activePhoto && (
        <div
          className="portfolio-lightbox-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`${activePhoto.category} enlarged photograph view`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActivePhoto(null);
            }
          }}
        >
          <button
            type="button"
            className="portfolio-lightbox-close"
            onClick={() => setActivePhoto(null)}
            aria-label="Close enlarged image view"
          >
            <X size={22} aria-hidden="true" />
          </button>

          <div
            className="portfolio-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activePhoto.src}
              alt={activePhoto.alt}
              width={activePhoto.width}
              height={activePhoto.height}
              className="portfolio-lightbox-image"
            />
            <div className="portfolio-lightbox-caption">
              <div className="lightbox-caption-left">
                <span className="portfolio-lightbox-category">{activePhoto.category}</span>
                {activeIndex >= 0 && (
                  <span className="lightbox-counter">{activeIndex + 1} of {filteredPhotos.length}</span>
                )}
              </div>
              <a
                href={getWhatsAppUrl(`Hi Saifi Interior Hub, I saw your ${activePhoto.category} project (${activePhoto.src}) on saifiinteriorhub.in and would like to discuss a similar interior execution.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp lightbox-whatsapp-btn"
              >
                <WhatsAppIcon size={16} />
                <span>Enquire About This Design</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
