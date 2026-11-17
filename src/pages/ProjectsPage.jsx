import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import {
  AlertCircle,
  X,
  Award,
  Eye,
  Search,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import WhatsAppIcon from '../components/common/WhatsAppIcon';
import { PROJECT_PHOTOS, PROJECT_CATEGORIES as STATIC_CATEGORIES } from '../data/projects';
import { getWhatsAppUrl, COMPANY_INFO } from '../data/designer';
import { getCategories } from '../services/categoryService';
import { getPublishedProjects } from '../services/projectService';
import { isSupabaseConfigured } from '../lib/supabase';
import { useSEO } from '../utils/useSEO';
import { gsap, isReducedMotion, refreshScrollTrigger } from '../utils/gsapConfig';
import './ProjectsPage.css';

// In-memory set of image sources that have already loaded during the browser session.
const loadedImagesCache = new Set();

function ProjectImage({ photo, priority, onError }) {
  const [isLoaded, setIsLoaded] = useState(() => loadedImagesCache.has(photo.src || photo.url));
  const imgRef = useRef(null);
  const src = photo.src || photo.url;

  useLayoutEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      loadedImagesCache.add(src);
      setIsLoaded(true);
    }
  }, [src]);

  const handleLoad = () => {
    loadedImagesCache.add(src);
    setIsLoaded(true);
  };

  return (
    <img
      ref={imgRef}
      src={src}
      alt={photo.alt || 'Interior work execution photograph - Saifi Interior Hub'}
      width={photo.width || 600}
      height={photo.height || 420}
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
  useSEO({ pageKey: 'projects' });
  const [categories, setCategories] = useState(["All Projects", ...STATIC_CATEGORIES.filter(c => c !== "All Projects")]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All Projects");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("order"); // 'order' | 'latest' | 'oldest'

  // Dynamic projects & photos state
  const [dynamicProjects, setDynamicProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [failedImages, setFailedImages] = useState(new Set());
  const [activePhoto, setActivePhoto] = useState(null);

  const pageRef = useRef(null);
  const filterToolbarRef = useRef(null);
  const galleryContainerRef = useRef(null);

  // 1. Fetch categories dynamically from Supabase (only active categories for public website)
  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      const { data, error } = await getCategories({ includeInactive: false });
      if (isMounted && !error && Array.isArray(data) && data.length > 0) {
        setCategoriesList(data);
        const catNames = ["All Projects", ...data.map(c => c.name)];
        setCategories(catNames);
      }
    }
    loadCategories();
    return () => { isMounted = false; };
  }, []);

  // 2. Fetch projects dynamically from Supabase
  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function fetchDynamicProjects() {
      let categorySlug = 'all';
      if (selectedCategory !== "All Projects" && selectedCategory !== "All") {
        const found = categoriesList.find(c => c.name.toLowerCase() === selectedCategory.toLowerCase());
        categorySlug = found ? found.slug : selectedCategory.toLowerCase().replace(/\s+/g, '-');
      }

      const { data, error } = await getPublishedProjects({
        categorySlug,
        searchQuery,
        sortBy
      });

      if (isMounted) {
        if (error && !data) {
          setFetchError(error.message || 'Unable to load projects at this time.');
        } else {
          setDynamicProjects(data || []);
          setFetchError(null);
        }
        setIsLoading(false);

        // Refresh ScrollTrigger after gallery renders
        setTimeout(() => {
          refreshScrollTrigger();
        }, 60);
      }
    }

    fetchDynamicProjects();

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, searchQuery, sortBy, reloadTrigger, categoriesList]);

  const handleRetry = () => {
    setIsLoading(true);
    setFetchError(null);
    setReloadTrigger(prev => prev + 1);
  };

  // Compute final display items:
  // If Supabase has published projects, use them.
  // Otherwise, use the extensive verified photos dataset (PROJECT_PHOTOS) filtered by category/search.
  const usingDynamicProjects = isSupabaseConfigured && dynamicProjects.length > 0;

  const displayedItems = usingDynamicProjects
    ? dynamicProjects
    : PROJECT_PHOTOS.filter(photo => {
        const matchesCategory = (selectedCategory === "All Projects" || selectedCategory === "All")
          ? true
          : photo.category.toLowerCase() === selectedCategory.toLowerCase();

        const matchesSearch = !searchQuery.trim()
          ? true
          : (photo.alt || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            photo.category.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesCategory && matchesSearch;
      });

  // Handle Category Selection
  const handleCategoryChange = (category) => {
    if (category === selectedCategory) return;
    setSelectedCategory(category);

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

  // Lock background scroll when lightbox is open
  useEffect(() => {
    if (!activePhoto) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActivePhoto(null);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activePhoto]);

  // GSAP: Initial Page Header & Filter Entrance
  useGSAP(() => {
    if (isReducedMotion()) return;

    gsap.from('.page-header-inner > *', {
      y: 25,
      opacity: 0,
      duration: 0.7,
      stagger: 0.1,
      ease: 'power2.out',
    });

    gsap.from('.category-filter-btn', {
      y: 14,
      opacity: 0,
      duration: 0.5,
      stagger: 0.03,
      ease: 'power2.out',
      delay: 0.25,
    });
  }, { scope: pageRef });

  // GSAP: Staggered animation when switching categories or search
  useGSAP(() => {
    if (isReducedMotion() || isLoading) return;

    gsap.fromTo('.portfolio-card',
      { y: 22, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.035,
        ease: 'power2.out',
      }
    );
  }, { scope: pageRef, dependencies: [selectedCategory, searchQuery, sortBy, isLoading] });

  const activeIndex = activePhoto ? displayedItems.findIndex(p => p.id === activePhoto.id) : -1;

  return (
    <div ref={pageRef} className="projects-page">
      {/* Header Banner */}
      <section className="page-header-wrapper" aria-label="Portfolio header">
        <div className="container">
          <div className="page-header-inner">
            <span className="badge">
              <Award size={14} className="badge-icon" />
              <span>{COMPANY_INFO.name} • 10+ Years Experience</span>
            </span>
            <h1 className="page-main-title">Completed Interior Work Portfolio</h1>
            <p className="page-main-desc">
              Explore 100+ real site photographs directly supervised and executed by {COMPANY_INFO.name} across Gurugram, Delhi, and Noida ({COMPANY_INFO.domain}). Every project represents genuine craftsmanship by our in-house trade specialists.
            </p>
          </div>
        </div>
      </section>

      {/* Sticky Dynamic Category Filter Toolbar */}
      <div ref={filterToolbarRef} className="projects-sticky-filter" aria-label="Category filter toolbar">
        <div className="container">
          <div className="category-filter-bar" role="tablist" aria-label="Filter projects by category">
            {categories.map(category => (
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

          {/* Dynamic Search & Sorting Controls Bar */}
          <div className="portfolio-controls-bar">
            <div className="portfolio-search-box">
              <Search size={15} className="portfolio-search-icon" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search by keyword, room type, or finish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="portfolio-search-input"
                aria-label="Search projects by keyword"
              />
            </div>

            <div className="portfolio-sort-wrapper">
              <label htmlFor="portfolio-sort" className="portfolio-sort-label">Sort By:</label>
              <select
                id="portfolio-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="portfolio-sort-select"
              >
                <option value="order">Curated Portfolio Order</option>
                <option value="latest">Latest Completed Sites</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div ref={galleryContainerRef} className="container">
        {/* Gallery Status Header */}
        <div className="portfolio-gallery-header">
          <p className="portfolio-count-text">
            Displaying <strong>{displayedItems.length}</strong> {selectedCategory === "All Projects" ? "verified execution photographs" : `${selectedCategory} installations`}
            {searchQuery && <span> matching "<strong>{searchQuery}</strong>"</span>}
          </p>
        </div>

        {/* 1. Loading Skeleton State */}
        {isLoading && (
          <div className="portfolio-skeleton-grid" aria-label="Loading projects">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="portfolio-skeleton-card">
                <div className="portfolio-skeleton-img" />
                <div className="portfolio-skeleton-body">
                  <div className="portfolio-skeleton-line" style={{ height: '18px', width: '40%', marginBottom: '0.65rem' }} />
                  <div className="portfolio-skeleton-line" style={{ height: '24px', width: '75%', marginBottom: '0.75rem' }} />
                  <div className="portfolio-skeleton-line" style={{ height: '14px', width: '50%' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. Error State with Retry */}
        {!isLoading && fetchError && (
          <div className="portfolio-error-banner" role="alert">
            <AlertCircle size={38} className="portfolio-error-icon" aria-hidden="true" />
            <h2 className="portfolio-error-title">Unable to Load Portfolio</h2>
            <p className="portfolio-error-text">{fetchError}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="btn btn-primary"
            >
              <RotateCcw size={15} />
              <span>Retry Connection</span>
            </button>
          </div>
        )}

        {/* 3. Empty State */}
        {!isLoading && !fetchError && displayedItems.length === 0 && (
          <div className="portfolio-empty-banner">
            <h2 className="portfolio-empty-title">No Projects Found</h2>
            <p className="portfolio-empty-text">
              {searchQuery
                ? `No projects or photos match "${searchQuery}" in ${selectedCategory}.`
                : `No installations found in ${selectedCategory} at this moment.`}
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("All Projects");
                setSearchQuery("");
              }}
              className="btn btn-outline"
            >
              <span>Reset All Filters</span>
            </button>
          </div>
        )}

        {/* 4. Portfolio Grid */}
        {!isLoading && !fetchError && displayedItems.length > 0 && (
          <div className="portfolio-grid" aria-label="Projects photographs gallery">
            {displayedItems.map((item, index) => {
              const isProject = Boolean(item.slug);
              const id = item.id;
              const isFailed = failedImages.has(id);
              const isPriority = index < 6;
              const itemTitle = item.title || `${item.category} Execution #${String(index + 1).padStart(2, '0')}`;
              const imgSrc = item.coverImage || item.src || item.url;
              const category = item.category;

              const enquiryUrl = getWhatsAppUrl(
                `Hi ${COMPANY_INFO.name}, I saw your ${category} interior work ("${itemTitle}") on saifiinteriorhub.in and would like similar execution for my space.`
              );

              return (
                <article key={id} className="portfolio-card">
                  <div
                    className="portfolio-card-media"
                    style={item.width && item.height ? { aspectRatio: `${item.width} / ${item.height}` } : undefined}
                    onClick={() => !isFailed && setActivePhoto({ ...item, src: imgSrc, category, title: itemTitle })}
                    role={!isFailed ? "button" : undefined}
                    tabIndex={!isFailed ? 0 : undefined}
                    onKeyDown={!isFailed ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActivePhoto({ ...item, src: imgSrc, category, title: itemTitle });
                      }
                    } : undefined}
                    aria-label={!isFailed ? `View enlarged ${category} photograph` : undefined}
                  >
                    {isFailed ? (
                      <div className="portfolio-image-error" role="alert">
                        <AlertCircle size={26} className="portfolio-error-icon" aria-hidden="true" />
                        <span className="portfolio-error-title">Image Unavailable</span>
                        <code className="portfolio-error-path">{imgSrc}</code>
                      </div>
                    ) : (
                      <>
                        <ProjectImage
                          photo={{ ...item, src: imgSrc }}
                          priority={isPriority}
                          onError={() => handleImageError(id, imgSrc)}
                        />
                        <div className="portfolio-hover-overlay" aria-hidden="true">
                          <div className="portfolio-hover-icon">
                            <Eye size={20} />
                            <span>View Detail</span>
                          </div>
                        </div>
                      </>
                    )}
                    <span className="project-badge">{category}</span>
                  </div>

                  <div className="portfolio-card-footer">
                    <div className="portfolio-card-meta">
                      {isProject ? (
                        <Link to={`/projects/${item.slug}`} className="portfolio-card-title" style={{ textDecoration: 'none', color: 'inherit' }}>
                          {itemTitle}
                        </Link>
                      ) : (
                        <span className="portfolio-card-title">{itemTitle}</span>
                      )}
                      <span className="portfolio-card-category">{category} {item.location ? `• ${item.location}` : ''}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      {isProject && (
                        <Link
                          to={`/projects/${item.slug}`}
                          className="portfolio-card-detail-link"
                          aria-label={`View full details for ${itemTitle}`}
                        >
                          <span>Details</span>
                          <ArrowRight size={13} />
                        </Link>
                      )}

                      <a
                        href={enquiryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="portfolio-card-enquire-btn"
                        aria-label={`Enquire about this ${category} work on WhatsApp`}
                        title="Enquire on WhatsApp"
                      >
                        <WhatsAppIcon size={15} />
                        <span>Enquire</span>
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
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
              alt={activePhoto.alt || activePhoto.title}
              width={activePhoto.width || 1200}
              height={activePhoto.height || 900}
              className="portfolio-lightbox-image"
            />
            <div className="portfolio-lightbox-caption">
              <div className="lightbox-caption-left">
                <span className="portfolio-lightbox-category">{activePhoto.category}</span>
                {activeIndex >= 0 && (
                  <span className="lightbox-counter">{activeIndex + 1} of {displayedItems.length}</span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                {activePhoto.slug && (
                  <Link
                    to={`/projects/${activePhoto.slug}`}
                    className="btn btn-outline"
                    style={{ padding: '0.5rem 0.95rem', fontSize: '0.82rem', background: '#fff' }}
                  >
                    <span>View Project Details</span>
                    <ArrowRight size={14} />
                  </Link>
                )}

                <a
                  href={getWhatsAppUrl(`Hi ${COMPANY_INFO.name}, I saw your ${activePhoto.category} project (${activePhoto.src}) on saifiinteriorhub.in and would like to discuss a similar interior execution.`)}
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
        </div>
      )}
    </div>
  );
}
