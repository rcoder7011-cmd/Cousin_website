import React from 'react';
import { ShieldCheck, Users, MapPin, Phone, Award, CheckCircle2 } from 'lucide-react';
import WhatsAppIcon from '../components/common/WhatsAppIcon';
import ExperienceShowcaseGSAP from '../components/common/ExperienceShowcaseGSAP';
import { COMPANY_INFO, getWhatsAppUrl } from '../data/designer';
import './AboutPage.css';

export default function AboutPage() {
  const whatsappUrl = getWhatsAppUrl(`Hi ${COMPANY_INFO.name}, I would like to learn more about your process and discuss an interior project in Delhi NCR.`);

  return (
    <div className="about-page">
      {/* Header Banner */}
      <section className="page-header-wrapper" aria-label="About header">
        <div className="container">
          <div className="page-header-inner">
            <span className="badge">
              <Award size={14} className="badge-icon" />
              <span>{COMPANY_INFO.name} • 10+ Years Experience</span>
            </span>
            <h1 className="page-main-title">About {COMPANY_INFO.name}</h1>
            <p className="page-main-desc">
              Discover our company story, interior design and interior work philosophy, and direct client supervision across Delhi NCR ({COMPANY_INFO.domain}).
            </p>
          </div>
        </div>
      </section>

      <div className="container about-container">
        {/* Core Experience Story Section (Task 7 Requirement) */}
        <section className="about-story-section" aria-label="Over a decade of experience">
          <div className="about-story-grid">
            <div className="about-story-text">
              <span className="section-eyebrow">Company Experience</span>
              <h2 className="about-story-title">Over a Decade of Creating Beautiful Spaces</h2>
              <p className="about-story-lead">
                With over 10 years of experience in interior design, we focus on creating beautiful, functional and thoughtfully designed spaces.
              </p>
              <p className="about-story-body">
                <strong>{COMPANY_INFO.name}</strong> was built on a foundational principle: exceptional interior design must be backed by master on-site execution. Rather than outsourcing site management to detached third-party contractors, our team personally oversees daily work on the ground alongside our in-house team of master craftsmen.
              </p>
              <p className="about-story-body">
                Over the past 10+ years, {COMPANY_INFO.name} has brought hundreds of bespoke living rooms, serene master bedrooms, high-efficiency modular kitchens, corporate cabins, and turnkey apartments to life across Gurugram, Delhi, and Noida.
              </p>

              <div className="about-highlights-list">
                <div className="about-hl-item">
                  <CheckCircle2 size={16} className="hl-icon" />
                  <span>10+ Years of site-tested residential & commercial interior work</span>
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
                  src="/images/projects/Living Room/4f7d5a2e-920d-47ae-8379-123563d80df4.png"
                  alt={`Modern luxury living space executed by ${COMPANY_INFO.name}`}
                  className="about-main-img"
                  loading="lazy"
                  decoding="async"
                  width="700"
                  height="520"
                />
                <div className="about-media-badge">
                  <span className="badge-num">10+</span>
                  <span className="badge-text">Years Experience — {COMPANY_INFO.name}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* GSAP-Animated Milestone & Experience Showcase */}
        <ExperienceShowcaseGSAP />

        {/* 3 Core Pillars */}
        <section className="about-pillars-section" aria-label="Core work values">
          <div className="section-header text-center">
            <span className="section-eyebrow">Why Clients Trust Us</span>
            <h2>Our Core Company Pillars</h2>
            <p className="section-description">
              The principles that guide every interior project executed by {COMPANY_INFO.name}.
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
                No corporate sales layers or rotating site supervisors. You work directly with {COMPANY_INFO.name}'s execution team responsible for drawing your layouts and supervising daily work.
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
        <section className="about-gallery-strip" aria-label="Craftsmanship snapshots">
          <div className="strip-grid">
            <div className="strip-item">
              <img
                src="/images/projects/Bedroom/34b5c063-c931-45f9-ab44-d4bfd075c02f.png"
                alt={`${COMPANY_INFO.name} master suite curved bed headboard`}
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
                alt={`${COMPANY_INFO.name} POP false ceiling detail`}
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
                alt={`${COMPANY_INFO.name} executive wood panelling`}
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
        <section className="about-cta-card" aria-label="Start consultation">
          <div className="about-cta-content">
            <span className="section-eyebrow">Start Your Journey</span>
            <h2>Ready to Transform Your Space with {COMPANY_INFO.name}?</h2>
            <p>
              Schedule an on-site visit or send your floor plan directly on WhatsApp for an honest discussion and transparent estimates from our 10+ years experienced team.
            </p>
          </div>
          <div className="about-cta-actions">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp about-btn-wa"
              aria-label={`Chat with ${COMPANY_INFO.name} on WhatsApp`}
            >
              <WhatsAppIcon size={20} />
              <span>Chat on WhatsApp</span>
            </a>
            <a
              href={`tel:${COMPANY_INFO.contact.phone.replace(/\s+/g, '')}`}
              className="btn btn-outline about-btn-call"
              aria-label={`Call ${COMPANY_INFO.name} at ${COMPANY_INFO.contact.phone}`}
            >
              <Phone size={17} aria-hidden="true" />
              <span>Call {COMPANY_INFO.contact.phone}</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
