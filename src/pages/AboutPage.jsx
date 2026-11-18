import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { ShieldCheck, Users, MapPin, Phone, Award, CheckCircle2 } from 'lucide-react';
import WhatsAppIcon from '../components/common/WhatsAppIcon';
import ExperienceShowcaseGSAP from '../components/common/ExperienceShowcaseGSAP';
import { useSettings } from '../context/useSettings';
import { useSEO } from '../utils/useSEO';
import { gsap, isReducedMotion } from '../utils/gsapConfig';
import './AboutPage.css';

export default function AboutPage() {
  const { companyName, phone, yearsExperience, getWhatsAppLink, homepage } = useSettings();
  useSEO({ pageKey: 'about' });

  const pageRef = useRef(null);
  const storySectionRef = useRef(null);
  const pillarsSectionRef = useRef(null);
  const galleryStripRef = useRef(null);
  const ctaSectionRef = useRef(null);

  const whatsappUrl = getWhatsAppLink(
    `Hi ${companyName}, I would like to learn more about your process and discuss an interior project in Delhi NCR.`
  );

  useGSAP(() => {
    if (isReducedMotion()) return;

    // 1. Page Header Entrance
    gsap.fromTo('.page-header-inner > *',
      { y: 25, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power2.out',
        clearProps: 'opacity,transform',
      }
    );

    // 2. Story Section Reveal
    gsap.fromTo('.about-story-text > *',
      { y: 30, opacity: 0 },
      {
        scrollTrigger: {
          trigger: storySectionRef.current,
          start: 'top 95%',
          once: true,
        },
        immediateRender: false,
        y: 0,
        opacity: 1,
        duration: 0.75,
        stagger: 0.1,
        ease: 'power2.out',
        clearProps: 'opacity,transform',
      }
    );

    gsap.fromTo('.about-media-card',
      { scale: 0.95, opacity: 0 },
      {
        scrollTrigger: {
          trigger: storySectionRef.current,
          start: 'top 95%',
          once: true,
        },
        immediateRender: false,
        scale: 1,
        opacity: 1,
        duration: 0.9,
        ease: 'power2.out',
        clearProps: 'opacity,transform',
      }
    );

    // 3. Core Pillars Stagger
    gsap.fromTo('.about-pillar-card',
      { y: 35, opacity: 0 },
      {
        scrollTrigger: {
          trigger: pillarsSectionRef.current,
          start: 'top 95%',
          once: true,
        },
        immediateRender: false,
        y: 0,
        opacity: 1,
        duration: 0.75,
        stagger: 0.14,
        ease: 'power2.out',
        clearProps: 'opacity,transform',
      }
    );

    // 4. Strip Items Reveal
    gsap.fromTo('.strip-item',
      { y: 25, opacity: 0 },
      {
        scrollTrigger: {
          trigger: galleryStripRef.current,
          start: 'top 95%',
          once: true,
        },
        immediateRender: false,
        y: 0,
        opacity: 1,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power2.out',
        clearProps: 'opacity,transform',
      }
    );

    // 5. CTA Card Pop
    if (ctaSectionRef.current) {
      gsap.fromTo(ctaSectionRef.current,
        { scale: 0.96, y: 25, opacity: 0 },
        {
          scrollTrigger: {
            trigger: ctaSectionRef.current,
            start: 'top 95%',
            once: true,
          },
          immediateRender: false,
          scale: 1,
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          clearProps: 'opacity,transform',
        }
      );
    }

  }, { scope: pageRef });

  return (
    <div ref={pageRef} className="about-page">
      {/* Header Banner */}
      <section className="page-header-wrapper" aria-label="About header">
        <div className="container">
          <div className="page-header-inner">
            <span className="badge">
              <Award size={14} className="badge-icon" />
              <span>{companyName} • {yearsExperience} Years Experience</span>
            </span>
            <h1 className="page-main-title">About {companyName}</h1>
            <p className="page-main-desc">
              Discover our company story, interior design and interior work philosophy, and direct client supervision across Delhi NCR (saifiinteriorhub.in).
            </p>
          </div>
        </div>
      </section>

      <div className="container about-container">
        {/* Core Experience Story Section (Task 7 Requirement) */}
        <section ref={storySectionRef} className="about-story-section" aria-label="Over a decade of experience">
          <div className="about-story-grid">
            <div className="about-story-text">
              <span className="section-eyebrow">Company Experience</span>
              <h2 className="about-story-title">{homepage?.about_heading || 'Over a Decade of Creating Beautiful Spaces'}</h2>
              <p className="about-story-lead">
                With over {yearsExperience} years of experience in interior design, we focus on creating beautiful, functional and thoughtfully designed spaces.
              </p>
              <p className="about-story-body">
                <strong>{companyName}</strong> was built on a foundational principle: exceptional interior design must be backed by master on-site execution. Rather than outsourcing site management to detached third-party contractors, our team personally oversees daily work on the ground alongside our in-house team of master craftsmen.
              </p>
              <p className="about-story-body">
                {homepage?.about_description || `Over the past ${yearsExperience} years, ${companyName} has brought hundreds of bespoke living rooms, serene master bedrooms, high-efficiency modular kitchens, corporate cabins, and turnkey apartments to life across Gurugram, Delhi, and Noida.`}
              </p>

              <div className="about-highlights-list">
                <div className="about-hl-item">
                  <CheckCircle2 size={16} className="hl-icon" />
                  <span>{yearsExperience} Years of site-tested residential & commercial interior work</span>
                </div>
                <div className="about-hl-item">
                  <CheckCircle2 size={16} className="hl-icon" />
                  <span>Direct daily site supervision with zero middleman markups</span>
                </div>
                <div className="about-hl-item">
                  <CheckCircle2 size={16} className="hl-icon" />
                  <span>In-house team of master carpenters, POP artisans, and painters</span>
                </div>
              </div>
            </div>

            <div className="about-story-media">
              <div className="about-media-card">
                <img
                  src="/Owner_img.png"
                  alt={`Owner of ${companyName} at studio`}
                  className="about-main-img about-owner-img"
                  loading="eager"
                  decoding="async"
                  width="1086"
                  height="1233"
                />
                <div className="about-media-badge">
                  <span className="badge-num">10+</span>
                  <span className="badge-text">Years On-Site Experience — {companyName}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* GSAP-Animated Milestone & Experience Showcase */}
        <ExperienceShowcaseGSAP />

        {/* 3 Core Pillars */}
        <section ref={pillarsSectionRef} className="about-pillars-section" aria-label="Core work values">
          <div className="section-header text-center">
            <span className="section-eyebrow">Why Clients Trust Us</span>
            <h2>Our Core Company Pillars</h2>
            <p className="section-description">
              The principles that guide every interior project executed by {companyName}.
            </p>
          </div>

          <div className="about-pillars-grid">
            <div className="about-pillar-card">
              <div className="about-pillar-icon" aria-hidden="true">
                <Users size={28} />
              </div>
              <h3 className="about-pillar-title">In-House Master Craftsmen</h3>
              <p className="about-pillar-text">
                Working directly with trusted carpenters, POP masters, painters, and electricians ensures consistent precision, seamless teamwork, and rapid problem-solving on the ground.
              </p>
            </div>

            <div className="about-pillar-card">
              <div className="about-pillar-icon" aria-hidden="true">
                <ShieldCheck size={28} />
              </div>
              <h3 className="about-pillar-title">Direct Accountability</h3>
              <p className="about-pillar-text">
                No corporate sales layers or rotating site supervisors. You work directly with {companyName}'s execution team responsible for drawing your layouts and supervising daily work.
              </p>
            </div>

            <div className="about-pillar-card">
              <div className="about-pillar-icon" aria-hidden="true">
                <MapPin size={28} />
              </div>
              <h3 className="about-pillar-title">Deep Delhi NCR Roots</h3>
              <p className="about-pillar-text">
                Operating actively across Gurugram, Delhi, and Noida with established vendor relationships for authentic marine ply, imported hardware, and luxury stone finishes.
              </p>
            </div>
          </div>
        </section>

        {/* Secondary Showcase Gallery Strip */}
        <section ref={galleryStripRef} className="about-gallery-strip" aria-label="Craftsmanship snapshots">
          <div className="strip-grid">
            <div className="strip-item">
              <img
                src="/images/projects/Bedroom/34b5c063-c931-45f9-ab44-d4bfd075c02f.png"
                alt={`${companyName} master suite curved bed headboard`}
                loading="lazy"
                decoding="async"
                width="400"
                height="300"
              />
              <span className="strip-label">Custom Joinery</span>
            </div>
            <div className="strip-item">
              <img
                src="/images/projects/Pop Ceiling/4c617dfa-40ad-4b7b-b8c0-f8d909091b8a.png"
                alt={`${companyName} POP false ceiling detail`}
                loading="lazy"
                decoding="async"
                width="400"
                height="300"
              />
              <span className="strip-label">False Ceiling Illumination</span>
            </div>
            <div className="strip-item">
              <img
                src="/images/projects/OFFICE/619a0583-75a7-4f10-a6b5-811d0b650f0a.png"
                alt={`${companyName} executive wood panelling`}
                loading="lazy"
                decoding="async"
                width="400"
                height="300"
              />
              <span className="strip-label">Veneer & Millwork</span>
            </div>
          </div>
        </section>

        {/* CTA Box */}
        <section ref={ctaSectionRef} className="about-cta-card" aria-label="Start consultation">
          <div className="about-cta-content">
            <span className="section-eyebrow">Start Your Journey</span>
            <h2>Ready to Transform Your Space with {companyName}?</h2>
            <p>
              Schedule an on-site visit or send your floor plan directly on WhatsApp for an honest discussion and transparent estimates from our {yearsExperience} experienced team.
            </p>
          </div>
          <div className="about-cta-actions">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp about-btn-wa"
              aria-label={`Chat with ${companyName} on WhatsApp`}
            >
              <WhatsAppIcon size={20} />
              <span>Chat on WhatsApp</span>
            </a>
            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="btn btn-outline about-btn-call"
              aria-label={`Call ${companyName} at ${phone}`}
            >
              <Phone size={17} aria-hidden="true" />
              <span>Call {phone}</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
