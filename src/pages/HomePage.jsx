import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { Phone, ArrowRight, CheckCircle2, MapPin, Award } from 'lucide-react';
import WhatsAppIcon from '../components/common/WhatsAppIcon';
import CompanyExperienceSection from '../components/home/CompanyExperienceSection';
import { COMPANY_INFO, getWhatsAppUrl } from '../data/designer';
import { SERVICES } from '../data/services';
import { PROJECTS } from '../data/projects';
import { gsap, isReducedMotion } from '../utils/gsapConfig';
import './HomePage.css';

export default function HomePage() {
  const pageRef = useRef(null);
  const heroRef = useRef(null);
  const projectsSectionRef = useRef(null);
  const servicesSectionRef = useRef(null);
  const ctaSectionRef = useRef(null);

  const heroWhatsApp = getWhatsAppUrl(`Hi ${COMPANY_INFO.name}, I am interested in interior design and interior work for my flat/home in Delhi NCR.`);

  // Highlight key 6 categories requested
  const primaryServices = SERVICES.slice(0, 6);

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

  }, { scope: pageRef });

  return (
    <div ref={pageRef} className="home-page">
      {/* 1. HERO SECTION */}
      <section ref={heroRef} className="hero-section" aria-label="Studio Introduction">
        <div className="container hero-container">
          <div className="hero-content">
            <div className="badge hero-badge">
              <Award size={14} className="hero-badge-icon" aria-hidden="true" />
              <span>{COMPANY_INFO.name} • 10+ Years Experience • Delhi NCR</span>
            </div>

            <h1 className="hero-title">
              Crafting Thoughtful Interiors with Direct Site Execution
            </h1>

            <p className="hero-subtitle">
              With over 10 years of experience in interior design and interior work, <strong>{COMPANY_INFO.name}</strong> pairs refined aesthetic vision with a dedicated team of master craftsmen. We transform concepts into refined residential and commercial spaces across Gurugram, Delhi, and Noida with direct personal site supervision.
            </p>

            <div className="hero-actions">
              <a
                href={heroWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp hero-whatsapp-btn"
                aria-label={`Enquire with ${COMPANY_INFO.name} on WhatsApp`}
              >
                <WhatsAppIcon size={20} />
                <span>Enquire on WhatsApp</span>
              </a>

              <Link to="/projects" className="btn btn-primary hero-portfolio-btn">
                <span>View Completed Sites</span>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>

              <a
                href={`tel:${COMPANY_INFO.contact.phone.replace(/\s+/g, '')}`}
                className="btn btn-outline hero-call-btn"
                aria-label={`Call ${COMPANY_INFO.name}`}
              >
                <Phone size={16} aria-hidden="true" />
                <span>{COMPANY_INFO.contact.phone}</span>
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
                <span>10+ Years Company Experience</span>
              </div>
            </div>
          </div>

          {/* Architectural Image Composition */}
          <div className="hero-media">
            <div className="hero-image-wrapper hero-primary-image">
              <img
                src="/images/projects/Living Room/78d10c45-348b-4c86-90f8-942b36a10bc9.png"
                alt="Luxury living room interior work executed by Saifi Interior Hub"
                className="hero-image"
                fetchPriority="high"
                decoding="async"
                width="1448"
                height="1086"
              />
              <div className="hero-floating-card">
                <Award size={24} className="card-icon" aria-hidden="true" />
                <div>
                  <div className="card-title">10+ Years Industry Experience</div>
                  <div className="card-text">{COMPANY_INFO.name} • Direct site supervision</div>
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
                Explore real residential and corporate spaces delivered by {COMPANY_INFO.name} across Gurugram, Delhi, and Noida.
              </p>
            </div>
            <Link to="/projects" className="btn btn-outline preview-all-btn project-header-reveal">
              <span>View All 100+ Photos</span>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>

          <div className="projects-grid">
            {PROJECTS.map(project => (
              <article key={project.id} className="project-card project-card-gsap">
                <div className="project-image-box">
                  <img
                    src={project.coverImage}
                    alt={`${project.title} - ${COMPANY_INFO.name}`}
                    loading="lazy"
                    decoding="async"
                    width="600"
                    height="420"
                  />
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
                  <h3 className="project-title">{project.title}</h3>
                  <p className="project-summary">{project.summary}</p>
                  <div className="project-scope">
                    <strong>Execution Scope:</strong> {project.scope}
                  </div>
                  <div className="project-card-action">
                    <a
                      href={getWhatsAppUrl(`Hi ${COMPANY_INFO.name}, I saw your project "${project.title}" in ${project.location} on saifiinteriorhub.in and would like similar interior work done.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-enquire-link"
                    >
                      <WhatsAppIcon size={16} />
                      <span>Enquire on WhatsApp</span>
                      <ArrowRight size={14} className="enquire-arrow" />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SERVICES DOMAINS (Task 5 & 8) */}
      <section ref={servicesSectionRef} className="services-section" aria-label="Interior design services">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-eyebrow services-header-reveal">Comprehensive Capabilities</span>
            <h2 className="services-header-reveal">Interior Design and Interior Work Services</h2>
            <p className="section-description services-header-reveal">
              From individual rooms to full flat and villa renovations, {COMPANY_INFO.name}'s master craftsmen execute every trade under direct studio supervision.
            </p>
          </div>

          <div className="services-grid">
            {primaryServices.map((service, index) => (
              <div key={service.id} className="service-card service-card-gsap">
                <div className="service-card-media">
                  <img
                    src={service.coverImage}
                    alt={`${service.title} - ${COMPANY_INFO.name}`}
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
                      href={getWhatsAppUrl(`Hi ${COMPANY_INFO.name}, I would like to enquire about ${service.title} for my space.`)}
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
              <h2>Have a Flat, Villa or Commercial Site Ready for Work?</h2>
              <p>
                Connect directly with <strong>{COMPANY_INFO.name}</strong> ({COMPANY_INFO.domain}). Benefit from more than 10 years of on-site execution experience. We provide practical architectural advice, material clarity, and transparent estimates across Gurugram, Delhi, and Noida.
              </p>
            </div>
            <div className="cta-banner-actions">
              <a
                href={heroWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp cta-big-btn"
                aria-label={`Chat directly with ${COMPANY_INFO.name} on WhatsApp`}
              >
                <WhatsAppIcon size={22} />
                <span>Chat Directly on WhatsApp</span>
              </a>
              <a
                href={`tel:${COMPANY_INFO.contact.phone.replace(/\s+/g, '')}`}
                className="btn btn-outline cta-phone-btn"
                aria-label={`Call ${COMPANY_INFO.name} at ${COMPANY_INFO.contact.phone}`}
              >
                <Phone size={18} aria-hidden="true" />
                <span>Call {COMPANY_INFO.contact.phone}</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
