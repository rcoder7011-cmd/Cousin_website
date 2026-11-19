import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import {
  Award,
  MapPin,
  Calendar,
  CheckCircle2,
  Phone,
  ArrowLeft,
  X,
  AlertCircle,
  FileEdit,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Images
} from 'lucide-react';
import WhatsAppIcon from '../components/common/WhatsAppIcon';
import { getProjectBySlug } from '../services/projectService';
import { useAuth } from '../context/useAuth';
import { useSEO } from '../utils/useSEO';
import { COMPANY_INFO, getWhatsAppUrl } from '../data/designer';
import { gsap, isReducedMotion, refreshScrollTrigger } from '../utils/gsapConfig';
import './ProjectDetailPage.css';

export default function ProjectDetailPage() {
  const { slug } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const pageRef = useRef(null);

  const isPreviewParam = new URLSearchParams(location.search).get('preview') === 'true';
  const allowDraft = Boolean(isPreviewParam || user);

  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(null);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const touchStartRef = useRef({ x: 0, y: 0 });

  useSEO({
    title: project ? `${project.title} | Saifi Interior Hub Project Portfolio` : undefined,
    description: project ? (project.description || `Explore ${project.title} executed with master interior craftsmanship by Saifi Interior Hub.`) : undefined,
    image: project?.cover_image,
    canonical: project ? `https://saifiinteriorhub.in/projects/${project.slug}` : undefined
  });

  // Fetch project from Supabase by slug
  useEffect(() => {
    let isMounted = true;
    async function fetchProject() {
      setIsLoading(true);
      setError(null);

      const { data, error: err } = await getProjectBySlug(slug, { allowDraft });

      if (isMounted) {
        if (err && !data) {
          setError(err.message || 'Failed to load project details.');
        } else {
          setProject(data);
        }
        setIsLoading(false);

        // Refresh GSAP triggers once content mounts
        setTimeout(() => {
          refreshScrollTrigger();
        }, 60);
      }
    }

    fetchProject();
    return () => {
      isMounted = false;
    };
  }, [slug, allowDraft]);

  // Gallery images array (cover image first, followed by all remaining images)
  const galleryImages = useMemo(() => {
    if (!project) return [];
    if (Array.isArray(project.images) && project.images.length > 0) {
      return project.images;
    }
    if (project.coverImage) {
      return [{
        id: 'cover-0',
        url: project.coverImage,
        alt: `${project.title} - Main Photograph`,
        displayOrder: 0
      }];
    }
    return [];
  }, [project]);

  // Navigation handlers for fullscreen lightbox
  const handlePrev = (e) => {
    e?.stopPropagation();
    if (galleryImages.length <= 1) return;
    setActiveLightboxIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    if (galleryImages.length <= 1) return;
    setActiveLightboxIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
  };

  // Lock background scroll and keyboard navigation when lightbox is open
  useEffect(() => {
    if (activeLightboxIndex === null) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveLightboxIndex(null);
      } else if (e.key === 'ArrowLeft') {
        setActiveLightboxIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
      } else if (e.key === 'ArrowRight') {
        setActiveLightboxIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeLightboxIndex, galleryImages.length]);

  // Mobile swipe gestures
  const handleTouchStart = (e) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = (e) => {
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    if (Math.abs(deltaX) > 45 && Math.abs(deltaY) < 90) {
      if (deltaX > 0) {
        handlePrev();
      } else {
        handleNext();
      }
    }
  };

  // GSAP Coordinated Entrance Animation
  useGSAP(() => {
    if (isReducedMotion() || isLoading || !project) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo('.project-header-meta > *',
      { y: 16, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.08,
        clearProps: 'opacity,transform',
      }
    );

    tl.fromTo('.project-detail-title',
      { y: 28, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.7,
        clearProps: 'opacity,transform',
      },
      '-=0.3'
    );

    tl.fromTo('.project-detail-lead',
      { y: 20, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        clearProps: 'opacity,transform',
      },
      '-=0.4'
    );

    tl.fromTo('.project-gallery-item',
      { scale: 0.96, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.7,
        stagger: 0.08,
        clearProps: 'opacity,transform',
      },
      '-=0.3'
    );

    tl.fromTo('.project-info-layout > *',
      { y: 24, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.65,
        stagger: 0.12,
        clearProps: 'opacity,transform',
      },
      '-=0.2'
    );

  }, { scope: pageRef, dependencies: [project, isLoading] });

  // 1. Loading State (Shimmer Skeleton)
  if (isLoading) {
    return (
      <div className="project-detail-page">
        <div className="container project-detail-skeleton">
          <div className="skeleton-box skeleton-breadcrumb" />
          <div className="skeleton-box skeleton-title" />
          <div className="skeleton-box skeleton-lead" />
          <div className="skeleton-box skeleton-cover" />
        </div>
      </div>
    );
  }

  // 2. Error / 404 Not Found State
  if (error || !project) {
    return (
      <div className="project-detail-page project-not-found-state">
        <div className="container">
          <div className="not-found-card">
            <div className="not-found-icon-wrap" aria-hidden="true">
              <AlertCircle size={36} />
            </div>
            <h1 className="not-found-title">Project Not Found</h1>
            <p className="not-found-desc">
              The interior project you requested (<code>{slug}</code>) could not be found or has not been published to the portfolio yet.
            </p>
            <div className="not-found-actions">
              <Link to="/projects" className="btn btn-primary">
                <ArrowLeft size={16} />
                <span>Return to Projects Portfolio</span>
              </Link>
              <Link to="/" className="btn btn-outline">
                <span>Go to Homepage</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const projectWhatsAppUrl = getWhatsAppUrl(
    `Hi ${COMPANY_INFO.name}, I was viewing your project "${project.title}" (${project.location}) on saifiinteriorhub.in and would like to discuss similar interior work for my flat/home.`
  );

  const INITIAL_DISPLAY_COUNT = 6;
  const hasMoreThanSix = galleryImages.length > INITIAL_DISPLAY_COUNT;
  const displayedGallery = showAllPhotos ? galleryImages : galleryImages.slice(0, INITIAL_DISPLAY_COUNT);
  const currentPhoto = activeLightboxIndex !== null ? galleryImages[activeLightboxIndex] : null;

  return (
    <div ref={pageRef} className="project-detail-page">
      {/* Draft Preview Callout for Admin */}
      {!project.isPublished && (
        <div style={{
          background: 'rgba(253, 126, 20, 0.12)',
          borderBottom: '1px solid rgba(253, 126, 20, 0.35)',
          padding: '0.75rem 1.25rem',
          textAlign: 'center',
          fontSize: '0.86rem',
          fontWeight: 600,
          color: '#d96509',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.6rem'
        }}>
          <FileEdit size={16} />
          <span>Admin Preview Mode: This project is currently saved as DRAFT and is not visible to public visitors.</span>
          <Link
            to={`/nimda-portal/projects/${project.id}/edit`}
            style={{
              color: '#d96509',
              textDecoration: 'underline',
              marginLeft: '0.5rem',
              fontWeight: 700
            }}
          >
            Edit in Admin
          </Link>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <nav className="project-breadcrumb-bar" aria-label="Breadcrumb">
        <div className="container">
          <div className="project-breadcrumbs">
            <Link to="/" className="breadcrumb-link">Home</Link>
            <span className="breadcrumb-separator">/</span>
            <Link to="/projects" className="breadcrumb-link">Completed Projects</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current" aria-current="page">{project.title}</span>
          </div>
        </div>
      </nav>

      <div className="container">
        {/* Header Section */}
        <header className="project-detail-header">
          <div className="project-header-meta">
            <span className="project-category-badge">{project.category}</span>
            <span className="project-hub-badge">
              <Award size={14} />
              <span>{COMPANY_INFO.name} • 10+ Years Experience</span>
            </span>
            <span className="project-location-badge">
              <MapPin size={14} />
              <span>{project.location}</span>
            </span>
            {project.projectDate && (
              <span className="project-date-badge">
                <Calendar size={14} />
                <span>{project.projectDate}</span>
              </span>
            )}
          </div>

          <h1 className="project-detail-title">{project.title}</h1>

          {project.summary && (
            <p className="project-detail-lead">{project.summary}</p>
          )}
        </header>

        {/* Premium Multi-Image Portfolio Gallery */}
        <section className="project-gallery-showcase" aria-label="Project photo gallery">
          <div className={`gallery-editorial-grid gallery-count-${Math.min(displayedGallery.length, 6)}`}>
            {displayedGallery.map((img, idx) => {
              const isHero = idx === 0;
              const isLastSlot = !showAllPhotos && hasMoreThanSix && idx === INITIAL_DISPLAY_COUNT - 1;
              const remainingCount = galleryImages.length - INITIAL_DISPLAY_COUNT;

              let gridClass = "project-gallery-item";
              if (isHero) gridClass += " gallery-item-hero";
              else gridClass += ` gallery-item-${idx}`;

              return (
                <div
                  key={img.id || img.url || idx}
                  className={gridClass}
                  onClick={() => setActiveLightboxIndex(idx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveLightboxIndex(idx);
                    }
                  }}
                  aria-label={`View photo ${idx + 1} of ${galleryImages.length}: ${img.alt || project.title}`}
                >
                  <img
                    src={img.url}
                    alt={img.alt || `${project.title} - View ${idx + 1}`}
                    className="gallery-item-img"
                    loading={isHero ? "eager" : "lazy"}
                    fetchPriority={isHero ? "high" : "auto"}
                    decoding="async"
                    width={isHero ? "1200" : "600"}
                    height={isHero ? "800" : "450"}
                  />
                  <div className="gallery-item-overlay">
                    <div className="gallery-item-badge">
                      <Maximize2 size={15} />
                      <span>{isHero ? "Highlight View" : `Photo ${idx + 1}`}</span>
                    </div>
                  </div>

                  {/* "+N More Photos" overlay on the 6th slot when more photos exist */}
                  {isLastSlot && remainingCount > 0 && (
                    <div
                      className="gallery-more-overlay"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAllPhotos(true);
                      }}
                      title="View all project photographs"
                    >
                      <div className="gallery-more-content">
                        <Images size={24} className="gallery-more-icon" />
                        <span className="gallery-more-count">+{remainingCount} Photos</span>
                        <span className="gallery-more-label">View Full Portfolio ({galleryImages.length})</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Expand / Collapse Button Bar for projects with 7+ images */}
          {hasMoreThanSix && (
            <div className="gallery-expand-bar">
              <button
                type="button"
                onClick={() => setShowAllPhotos(!showAllPhotos)}
                className="btn btn-outline gallery-expand-btn"
                aria-expanded={showAllPhotos}
              >
                <Images size={16} />
                <span>{showAllPhotos ? "Show Curated 6 Photos" : `View All Photos (${galleryImages.length})`}</span>
              </button>
            </div>
          )}
        </section>

        {/* Narrative & Technical Scope Layout */}
        <div className="project-info-layout">
          {/* Main Content Column */}
          <article className="project-narrative-card">
            <h2 className="narrative-heading">Execution Overview</h2>
            <p className="narrative-body">
              {project.description || project.summary}
            </p>

            {/* Scope Details */}
            {project.scope && (
              <div className="project-highlights-box">
                <div className="highlights-title">Execution Scope & Trades:</div>
                <p className="highlight-item" style={{ fontSize: '1rem', color: 'var(--color-primary)' }}>
                  <strong>{project.scope}</strong>
                </p>
              </div>
            )}

            {/* Architectural Highlights */}
            {project.highlights && project.highlights.length > 0 && (
              <div className="project-highlights-box">
                <div className="highlights-title">Key Architectural Features:</div>
                <ul className="highlights-list">
                  {project.highlights.map((highlight, index) => (
                    <li key={index} className="highlight-item">
                      <CheckCircle2 size={16} className="highlight-icon" aria-hidden="true" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>

          {/* Sidebar Specifications & Quick CTA */}
          <aside className="project-specs-sidebar">
            <div className="project-specs-card">
              <h3 className="specs-card-title">Project Specifications</h3>
              <div className="specs-row-list">
                <div className="spec-row">
                  <span className="spec-label">Project Category</span>
                  <span className="spec-value">{project.category}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Site Location</span>
                  <span className="spec-value">{project.location} • Delhi NCR</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Turnkey Delivery</span>
                  <span className="spec-value">{project.completionTime || 'Delivered On Schedule'}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Execution Team</span>
                  <span className="spec-value">{COMPANY_INFO.name} (Direct On-Site)</span>
                </div>
              </div>
            </div>

            {/* Direct Consultation Box */}
            <div className="project-sidebar-cta">
              <h3 className="cta-box-title">Want Similar Interior Work?</h3>
              <p className="cta-box-desc">
                Connect directly with <strong>{COMPANY_INFO.name}</strong> to review your floor plan and get an honest, transparent estimate.
              </p>
              <div className="project-cta-actions">
                <a
                  href={projectWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp cta-wa-btn"
                >
                  <WhatsAppIcon size={18} />
                  <span>Enquire on WhatsApp</span>
                </a>
                <a
                  href={`tel:${COMPANY_INFO.contact.phone.replace(/\s+/g, '')}`}
                  className="btn btn-outline cta-call-btn"
                >
                  <Phone size={15} />
                  <span>Call {COMPANY_INFO.contact.phone}</span>
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {activeLightboxIndex !== null && currentPhoto && (
        <div
          className="portfolio-lightbox-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveLightboxIndex(null)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top Control Bar */}
          <div className="lightbox-top-bar" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-counter-badge">
              <Images size={15} />
              <span>{activeLightboxIndex + 1} of {galleryImages.length}</span>
            </div>

            <button
              type="button"
              className="portfolio-lightbox-close"
              onClick={() => setActiveLightboxIndex(null)}
              aria-label="Close enlarged photo"
            >
              <X size={22} />
            </button>
          </div>

          {/* Navigation Arrows */}
          {galleryImages.length > 1 && (
            <>
              <button
                type="button"
                className="lightbox-nav-btn lightbox-prev-btn"
                onClick={handlePrev}
                aria-label="Previous photo (Left arrow)"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                type="button"
                className="lightbox-nav-btn lightbox-next-btn"
                onClick={handleNext}
                aria-label="Next photo (Right arrow)"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}

          {/* Centered Main Image */}
          <div className="portfolio-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={currentPhoto.url}
              alt={currentPhoto.alt || `${project.title} photo ${activeLightboxIndex + 1}`}
              className="portfolio-lightbox-image"
              decoding="async"
            />

            {/* Bottom Caption Bar */}
            <div className="portfolio-lightbox-caption">
              <div className="lightbox-caption-meta">
                <span className="portfolio-lightbox-category">{project.category}</span>
                <span className="lightbox-caption-title">{project.title}</span>
                <span className="lightbox-caption-loc">• {project.location}</span>
              </div>
              <a
                href={getWhatsAppUrl(
                  `Hi ${COMPANY_INFO.name}, I was viewing photo #${activeLightboxIndex + 1} of your project "${project.title}" (${project.location}) on saifiinteriorhub.in and would like to discuss similar interior execution.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp lightbox-whatsapp-btn"
              >
                <WhatsAppIcon size={16} />
                <span>Enquire on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
