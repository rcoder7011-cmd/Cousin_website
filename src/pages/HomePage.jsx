import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { Phone, ArrowRight, CheckCircle2, MapPin, Award } from 'lucide-react';
import WhatsAppIcon from '../components/common/WhatsAppIcon';
import CompanyExperienceSection from '../components/home/CompanyExperienceSection';
import { useSettings } from '../context/useSettings';
import { useSEO } from '../utils/useSEO';
import { SERVICES } from '../data/services';
import { getFeaturedProjects } from '../services/projectService';
import { gsap, isReducedMotion, refreshScrollTrigger } from '../utils/gsapConfig';
import './HomePage.css';

export default function HomePage() {
  const {
    companyName,
    phone,
    yearsExperience,
    getWhatsAppLink,
    homepage,
    advanced
  } = useSettings();

  useSEO({ pageKey: 'home' });

  const pageRef = useRef(null);
  const heroRef = useRef(null);
  const projectsSectionRef = useRef(null);
  const servicesSectionRef = useRef(null);
  const ctaSectionRef = useRef(null);

  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  const heroWhatsApp = getWhatsAppLink(
    `Hi ${companyName}, I am interested in interior design and interior work for my flat/home in Delhi NCR.`
  );

  // Highlight key 6 categories requested
  const primaryServices = SERVICES.slice(0, 6);

  // Dynamic Fetch for Featured Projects from Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadFeatured() {
      setIsLoadingProjects(true);
      const { data } = await getFeaturedProjects(4);
      if (isMounted) {
        setFeaturedProjects(data || []);
        setIsLoadingProjects(false);
        setTimeout(() => {
          refreshScrollTrigger();
        }, 80);
      }
    }
    loadFeatured();
    return () => {
      isMounted = false;
    };
  }, []);

  // Coordinated GSAP Animations across the Homepage
  useGSAP(() => {
    if (isReducedMotion()) return;

    // 1. HERO ENTRANCE TIMELINE (Runs on initial mount)
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Badge entrance from top
    heroTl.from('.hero-badge', {
      y: -24,
      opacity: 0,
      duration: 0.8,
    });

    // Heading reveal from bottom
    heroTl.from('.hero-title', {
      y: 40,
      opacity: 0,
      duration: 1.0,
    }, '-=0.5');

    // Subtitle fade & slide up
    heroTl.from('.hero-subtitle', {
      y: 25,
      opacity: 0,
      duration: 0.85,
    }, '-=0.6');

    // CTA buttons staggered entrance
    heroTl.from('.hero-actions .btn', {
      y: 20,
      opacity: 0,
      duration: 0.65,
      stagger: 0.12,
    }, '-=0.5');

    // Trust items staggered entrance
    heroTl.from('.trust-item', {
      y: 16,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
    }, '-=0.4');

    // Hero media entrance from right with scale
    heroTl.from('.hero-primary-image', {
      x: 35,
      scale: 0.96,
      opacity: 0,
      duration: 1.1,
      ease: 'power2.out',
    }, '-=1.2');

    // Hero floating card pop
    heroTl.from('.hero-floating-card', {
      scale: 0.85,
      y: 20,
      opacity: 0,
      duration: 0.75,
      ease: 'back.out(1.7)',
    }, '-=0.5');

    // Hero secondary inset card
    heroTl.from('.hero-secondary-card', {
      x: 25,
      y: 25,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out',
    }, '-=0.5');

    // 2. FEATURED PROJECTS SECTION (ScrollTrigger)
    gsap.from('.project-header-reveal', {
      scrollTrigger: {
        trigger: projectsSectionRef.current,
        start: 'top 80%',
        once: true,
      },
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.12,
      ease: 'power2.out',
    });

    if (featuredProjects.length > 0) {
      gsap.from('.project-card-gsap', {
        scrollTrigger: {
          trigger: '.projects-grid',
          start: 'top 82%',
          once: true,
        },
        y: 45,
        opacity: 0,
        duration: 0.85,
        stagger: 0.16,
        ease: 'power2.out',
      });
    }

    // 3. SERVICES SECTION (ScrollTrigger)
    gsap.from('.services-header-reveal', {
      scrollTrigger: {
        trigger: servicesSectionRef.current,
        start: 'top 80%',
        once: true,
      },
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.12,
      ease: 'power2.out',
    });

    gsap.from('.service-card-gsap', {
      scrollTrigger: {
        trigger: '.services-grid',
        start: 'top 82%',
        once: true,
      },
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power2.out',
    });

    // 4. CONSULTATION CTA BANNER (ScrollTrigger)
    gsap.from('.cta-banner-card', {
      scrollTrigger: {
        trigger: ctaSectionRef.current,
        start: 'top 85%',
        once: true,
      },
      scale: 0.96,
      y: 30,
      opacity: 0,
      duration: 0.9,
      ease: 'power2.out',
    });

  }, { scope: pageRef, dependencies: [featuredProjects, isLoadingProjects] });

  const heroHeading = homepage?.hero_heading || 'Crafting Thoughtful Interiors with Direct Site Execution';
  const heroSubtitle = homepage?.hero_subtitle || `With over 10 years of experience in interior design and interior work, ${companyName} pairs refined aesthetic vision with a dedicated team of master craftsmen. We transform concepts into refined residential and commercial spaces across Gurugram, Delhi, and Noida with direct personal site supervision.`;
  const heroBtnText = homepage?.hero_btn_text || 'View Completed Sites';
  const heroBtnLink = homepage?.hero_btn_link || '/projects';
  const heroImageSrc = homepage?.hero_image || '/images/projects/Living Room/78d10c45-348b-4c86-90f8-942b36a10bc9.png';

  const ctaHeading = homepage?.cta_heading || 'Have a Flat, Villa or Commercial Site Ready for Work?';
  const ctaDesc = homepage?.cta_description || `Connect directly with ${companyName} (saifiinteriorhub.in). Benefit from more than 10 years of on-site execution experience. We provide practical architectural advice, material clarity, and transparent estimates across Gurugram, Delhi, and Noida.`;
  const ctaBtnText = homepage?.cta_btn_text || 'Chat Directly on WhatsApp';

  return (
    <div ref={pageRef} className="home-page">
      {/* Maintenance Mode Notice Banner */}
      {advanced?.maintenance_mode && (
        <div style={{
          background: '#fff3cd',
          color: '#856404',
          borderBottom: '1px solid #ffeeba',
          padding: '0.75rem 1rem',
          textAlign: 'center',
          fontSize: '0.88rem',
          fontWeight: 500
        }}>
          ⚠️ {advanced?.maintenance_message || 'We are currently updating our portfolio. Please contact us on WhatsApp for immediate enquiries.'}
        </div>
      )}

      {/* 1. HERO SECTION */}
      <section ref={heroRef} className="hero-section" aria-label="Studio Introduction">
        <div className="container hero-container">
          <div className="hero-content">
            <div className="badge hero-badge">
              <Award size={14} className="hero-badge-icon" aria-hidden="true" />
              <span>{companyName} • {yearsExperience} Years Experience • Delhi NCR</span>
            </div>

            <h1 className="hero-title">
              {heroHeading}
            </h1>

            <p className="hero-subtitle">
              {heroSubtitle}
            </p>

            <div className="hero-actions">
              <a
                href={heroWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp hero-whatsapp-btn"
                aria-label={`Enquire with ${companyName} on WhatsApp`}
              >
                <WhatsAppIcon size={20} />
                <span>Enquire on WhatsApp</span>
              </a>

              <Link to={heroBtnLink} className="btn btn-primary hero-portfolio-btn">
                <span>{heroBtnText}</span>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>

              <a
                href={`tel:${phone.replace(/\s+/g, '')}`}
                className="btn btn-outline hero-call-btn"
                aria-label={`Call ${companyName}`}
              >
                <Phone size={16} aria-hidden="true" />
                <span>{phone}</span>
              </a>
            </div>

            {/* Trust Highlights */}
            <div className="hero-trust-list">
              <div className="trust-item">
                <CheckCircle2 size={16} className="trust-icon" aria-hidden="true" />
                <span>Direct Site Supervision</span>
              </div>
              <div className="trust-item">
                <CheckCircle2 size={16} className="trust-icon" aria-hidden="true" />
                <span>Dedicated In-House Craftsmen</span>
              </div>
              <div className="trust-item">
                <CheckCircle2 size={16} className="trust-icon" aria-hidden="true" />
                <span>{yearsExperience} Years Company Experience</span>
              </div>
            </div>
          </div>

          {/* Architectural Image Composition */}
          <div className="hero-media">
            <div className="hero-image-wrapper hero-primary-image">
              <img
                src={heroImageSrc}
                alt={`Luxury interior work executed by ${companyName}`}
                className="hero-image"
                fetchPriority="high"
                decoding="async"
                width="1448"
                height="1086"
              />
              <div className="hero-floating-card">
                <Award size={24} className="card-icon" aria-hidden="true" />
                <div>
                  <div className="card-title">{yearsExperience} Years Industry Experience</div>
                  <div className="card-text">{companyName} • Direct site supervision</div>
                </div>
              </div>
            </div>

            {/* Inset Detail Image */}
            <div className="hero-secondary-card">
              <img
                src="/images/projects/Bedroom/34b5c063-c931-45f9-ab44-d4bfd075c02f.png"
                alt="Master bedroom detail executed by Saifi Interior Hub with curved walnut headboard"
                className="hero-secondary-img"
                loading="lazy"
                decoding="async"
                width="400"
                height="320"
              />
              <div className="hero-secondary-caption">
                <span>Gurugram Master Suite</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DEDICATED COMPANY EXPERIENCE SECTION — 10+ YEARS (Task 4) */}
      <CompanyExperienceSection />

      {/* 3. FEATURED PROJECTS SHOWCASE (Task 5 & 6) */}
      <section ref={projectsSectionRef} className="projects-preview-section" aria-label="Recent work showcase">
        <div className="container">
          <div className="section-header-flex">
            <div>
              <span className="section-eyebrow project-header-reveal">Portfolio Showcase</span>
              <h2 className="project-header-reveal">Signature Completed Projects</h2>
              <p className="section-description project-header-reveal">
                Explore real residential and corporate spaces delivered by {companyName} across Gurugram, Delhi, and Noida.
              </p>
            </div>
            <Link to="/projects" className="btn btn-outline preview-all-btn project-header-reveal">
              <span>View All 100+ Photos</span>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>

          {/* Loading Skeletons */}
          {isLoadingProjects && (
            <div className="projects-grid">
              {[1, 2].map((n) => (
                <div key={n} className="project-card project-card-skeleton">
                  <div className="skeleton-box" style={{ height: '280px', width: '100%' }} />
                  <div style={{ padding: '1.5rem' }}>
                    <div className="skeleton-box" style={{ height: '18px', width: '35%', marginBottom: '0.85rem' }} />
                    <div className="skeleton-box" style={{ height: '26px', width: '75%', marginBottom: '1rem' }} />
                    <div className="skeleton-box" style={{ height: '15px', width: '100%', marginBottom: '0.5rem' }} />
                    <div className="skeleton-box" style={{ height: '15px', width: '60%' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoadingProjects && featuredProjects.length === 0 && (
            <div className="projects-empty-banner text-center" style={{ padding: '3.5rem 1.5rem', background: 'var(--color-bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.25rem', fontSize: '1.05rem' }}>
                Our team is currently curating featured installations. You can view all completed on-site photographs in our full gallery.
              </p>
              <Link to="/projects" className="btn btn-primary">
                <span>Explore Full Portfolio</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          )}

          {/* Dynamic Featured Projects List */}
          {!isLoadingProjects && featuredProjects.length > 0 && (
            <div className="projects-grid">
              {featuredProjects.map(project => (
                <article key={project.id} className="project-card project-card-gsap">
                  <div className="project-image-box">
                    <Link to={`/projects/${project.slug}`} aria-label={`View project details for ${project.title}`}>
                      <img
                        src={project.coverImage}
                        alt={`${project.title} - ${companyName}`}
                        loading="lazy"
                        decoding="async"
                        width="600"
                        height="420"
                      />
                    </Link>
                    <div className="project-badges-row">
                      <span className="project-badge">{project.category}</span>
                      <span className="project-time-badge">{project.completionTime}</span>
                    </div>
                  </div>
                  <div className="project-info">
                    <div className="project-location">
                      <MapPin size={14} className="location-pin" aria-hidden="true" />
                      <span>{project.location} • Turnkey Execution</span>
                    </div>
                    <h3 className="project-title">
                      <Link to={`/projects/${project.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {project.title}
                      </Link>
                    </h3>
                    <p className="project-summary">{project.summary}</p>
                    {project.scope && (
                      <div className="project-scope">
                        <strong>Execution Scope:</strong> {project.scope}
                      </div>
                    )}
                    <div className="project-card-action" style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                      <Link
                        to={`/projects/${project.slug}`}
                        className="btn btn-outline"
                        style={{ padding: '0.5rem 0.9rem', fontSize: '0.82rem' }}
                      >
                        <span>View Project</span>
                        <ArrowRight size={13} />
                      </Link>
                      <a
                        href={getWhatsAppLink(`Hi ${companyName}, I saw your project "${project.title}" in ${project.location} on saifiinteriorhub.in and would like similar interior work done.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="project-enquire-link"
                      >
                        <WhatsAppIcon size={15} />
                        <span>Enquire on WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. SERVICES DOMAINS (Task 5 & 8) */}
      <section ref={servicesSectionRef} className="services-section" aria-label="Interior design services">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-eyebrow services-header-reveal">Comprehensive Capabilities</span>
            <h2 className="services-header-reveal">Interior Design and Interior Work Services</h2>
            <p className="section-description services-header-reveal">
              From individual rooms to full flat and villa renovations, {companyName}'s master craftsmen execute every trade under direct studio supervision.
            </p>
          </div>

          <div className="services-grid">
            {primaryServices.map((service, index) => (
              <div key={service.id} className="service-card service-card-gsap">
                <div className="service-card-media">
                  <img
                    src={service.coverImage}
                    alt={`${service.title} - ${companyName}`}
                    loading="lazy"
                    decoding="async"
                    width="500"
                    height="320"
                    className="service-card-img"
                  />
                  <span className="service-tag">{service.tag || `0${index + 1}`}</span>
                </div>

                <div className="service-card-body">
                  <h3 className="service-card-title">{service.title}</h3>
                  <p className="service-card-desc">{service.shortDescription}</p>

                  <ul className="service-scope-list">
                    {service.scope.slice(0, 3).map((item, i) => (
                      <li key={i}>
                        <CheckCircle2 size={15} className="service-check-icon" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="service-card-footer">
                    <a
                      href={getWhatsAppLink(`Hi ${companyName}, I would like to enquire about ${service.title} for my space.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="service-whatsapp-link"
                    >
                      <WhatsAppIcon size={16} />
                      <span>Enquire for this Service</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="services-footer-cta text-center">
            <Link to="/services" className="btn btn-outline services-view-all-btn">
              <span>View All 8 Execution Services & Complete Scopes</span>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. CONSULTATION CALLOUT BANNER (Task 5) */}
      <section ref={ctaSectionRef} className="cta-banner-section" aria-label="Schedule a consultation">
        <div className="container">
          <div className="cta-banner-card">
            <div className="cta-banner-content">
              <span className="cta-banner-eyebrow">Direct Collaboration</span>
              <h2>{ctaHeading}</h2>
              <p>
                {ctaDesc}
              </p>
            </div>
            <div className="cta-banner-actions">
              <a
                href={heroWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp cta-big-btn"
                aria-label={`Chat directly with ${companyName} on WhatsApp`}
              >
                <WhatsAppIcon size={22} />
                <span>{ctaBtnText}</span>
              </a>
              <a
                href={`tel:${phone.replace(/\s+/g, '')}`}
                className="btn btn-outline cta-phone-btn"
                aria-label={`Call ${companyName} at ${phone}`}
              >
                <Phone size={18} aria-hidden="true" />
                <span>Call {phone}</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
