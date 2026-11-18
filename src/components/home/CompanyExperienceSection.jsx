import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { ShieldCheck, Hammer, Sparkles, MapPin, ArrowRight, Award } from 'lucide-react';
import { gsap, isReducedMotion } from '../../utils/gsapConfig';
import { useSettings } from '../../context/useSettings';
import './CompanyExperienceSection.css';

export default function CompanyExperienceSection() {
  const { companyName, yearsExperience, homepage } = useSettings();
  const sectionRef = useRef(null);
  const numberRef = useRef(null);
  const counterBoxRef = useRef(null);

  const targetYears = parseInt(homepage?.experience_number || yearsExperience || '10', 10) || 10;

  useGSAP(() => {
    if (isReducedMotion()) {
      if (numberRef.current) numberRef.current.innerText = targetYears.toString();
      return;
    }

    // ScrollTrigger timeline that triggers once when the section enters viewport
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 92%',
        once: true, // Prevents unnecessary restarts on scroll
      }
    });

    // 1. Text elements entrance (eyebrow, heading, supporting text)
    tl.fromTo('.exp-reveal-item',
      { y: 35, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.85,
        stagger: 0.12,
        ease: 'power3.out',
        clearProps: 'opacity,transform',
      }
    );

    // 2. Animated Counter: 0 to targetYears
    const counterObj = { value: 0 };
    tl.to(counterObj, {
      value: targetYears,
      duration: 1.8,
      ease: 'power2.out',
      onUpdate: () => {
        if (numberRef.current) {
          numberRef.current.innerText = Math.floor(counterObj.value).toString();
        }
      }
    }, '-=0.6');

    // 3. Counter Box pop & glow effect
    if (counterBoxRef.current) {
      tl.fromTo(counterBoxRef.current,
        { scale: 0.9, borderColor: 'rgba(179, 136, 56, 0.1)' },
        {
          scale: 1,
          duration: 1,
          ease: 'back.out(1.6)',
          clearProps: 'transform,borderColor',
        },
        '-=1.6'
      );
    }

    // 4. Verified Company Attribute Cards entrance
    tl.fromTo('.exp-attribute-item',
      { y: 25, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power2.out',
        clearProps: 'opacity,transform',
      },
      '-=1.0'
    );

    // 5. Visual Composition Reveal (Main image clip & scale)
    tl.fromTo('.exp-main-frame',
      { scale: 0.96, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 1.1,
        ease: 'power2.out',
        clearProps: 'opacity,transform',
      },
      '-=1.4'
    );

    // 6. Accent image and Floating badge
    tl.fromTo('.exp-accent-frame',
      { x: 30, y: 30, opacity: 0 },
      {
        x: 0,
        y: 0,
        opacity: 1,
        duration: 0.9,
        ease: 'power2.out',
        clearProps: 'opacity,transform',
      },
      '-=0.8'
    );

    tl.fromTo('.exp-floating-badge',
      { scale: 0.85, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.7,
        ease: 'back.out(1.7)',
        clearProps: 'opacity,transform',
      },
      '-=0.6'
    );

  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="company-experience-section" aria-label="Company Experience">
      <div className="container">
        <div className="exp-section-grid">
          {/* Left Column: Official Narrative & Experience Counter */}
          <div className="exp-content-column">
            <span className="section-eyebrow exp-reveal-item">
              Company Experience • {companyName}
            </span>

            {/* Dynamic Section Heading */}
            <h2 className="exp-main-heading exp-reveal-item">
              {homepage?.experience_heading || `${yearsExperience} Years of Transforming Spaces`}
            </h2>

            {/* Dynamic Supporting Text */}
            <p className="exp-supporting-text exp-reveal-item">
              {homepage?.experience_description || `With over a decade of experience in interior design, ${companyName} creates beautiful, functional and inspiring spaces tailored to our clients' needs.`}
            </p>

            {/* Dedicated Animated Counter Card */}
            <div ref={counterBoxRef} className="exp-counter-banner exp-reveal-item">
              <div className="exp-counter-left">
                <div className="exp-counter-digits">
                  <span ref={numberRef} className="exp-digit-value">{targetYears}</span>
                  <span className="exp-digit-suffix">+ Years</span>
                </div>
                <div className="exp-counter-subline">
                  {homepage?.experience_label || 'Company Interior Design Experience'}
                </div>
              </div>

              <div className="exp-counter-right">
                <Award size={36} className="exp-award-icon" aria-hidden="true" />
                <span className="exp-award-tag">{yearsExperience} of Craftsmanship in Delhi NCR</span>
              </div>
            </div>

            {/* Secondary Narrative on Execution Model */}
            <p className="exp-narrative-text exp-reveal-item">
              Founded on the belief that great design demands direct site execution, <strong>{companyName}</strong> eliminates detached middlemen. Our dedicated in-house team of master carpenters, false-ceiling technicians, and surface painters ensures that every measurement, material grade, and joinery joint meets uncompromising standards.
            </p>

            {/* Verified Company Attributes (No fabricated claims) */}
            <div className="exp-attributes-grid">
              <div className="exp-attribute-item">
                <div className="exp-attr-icon-box" aria-hidden="true">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="exp-attr-title">Direct Site Supervision</h3>
                  <p className="exp-attr-desc">Daily personal oversight on every site with zero sub-contracting markups.</p>
                </div>
              </div>

              <div className="exp-attribute-item">
                <div className="exp-attr-icon-box" aria-hidden="true">
                  <Hammer size={20} />
                </div>
                <div>
                  <h3 className="exp-attr-title">In-House Master Craftsmen</h3>
                  <p className="exp-attr-desc">Specialized carpenters, POP artisans, and finishing painters working under one roof.</p>
                </div>
              </div>

              <div className="exp-attribute-item">
                <div className="exp-attr-icon-box" aria-hidden="true">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="exp-attr-title">Authentic Material Sourcing</h3>
                  <p className="exp-attr-desc">Branded hardware, boiling waterproof ply, and verified architectural finishes.</p>
                </div>
              </div>

              <div className="exp-attribute-item">
                <div className="exp-attr-icon-box" aria-hidden="true">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="exp-attr-title">Regional NCR Coverage</h3>
                  <p className="exp-attr-desc">Active turnkey execution across Gurugram, Delhi, and Noida.</p>
                </div>
              </div>
            </div>

            <div className="exp-action-row exp-reveal-item">
              <Link to="/about" className="btn btn-outline exp-explore-btn">
                <span>Explore Our 10+ Years Journey</span>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Right Column: Premium Visual Composition using Real Completed Projects */}
          <div className="exp-visual-column">
            {/* Primary Main Image Frame: Owner & Studio */}
            <div className="exp-main-frame">
              <img
                src="/Owner_img.png"
                alt={`Owner of ${companyName} at studio showroom`}
                className="exp-main-img"
                loading="lazy"
                decoding="async"
                width="1086"
                height="1233"
              />
              <div className="exp-main-caption">
                <span className="exp-caption-title">Direct On-Site Supervision</span>
                <span className="exp-caption-loc">{companyName} • 10+ Years Experience</span>
              </div>
            </div>

            {/* Overlapping Accent Frame */}
            <div className="exp-accent-frame">
              <img
                src="/images/projects/Living Room/4f7d5a2e-920d-47ae-8379-123563d80df4.png"
                alt="Modern luxury living space with acoustic false ceiling by Saifi Interior Hub"
                className="exp-accent-img"
                loading="lazy"
                decoding="async"
                width="450"
                height="340"
              />
              <div className="exp-accent-caption">
                <span>Living Room Architectural Lighting</span>
              </div>
            </div>

            {/* Floating Experience Badge */}
            <div className="exp-floating-badge">
              <div className="badge-ring" aria-hidden="true">
                <Award size={22} />
              </div>
              <div>
                <div className="badge-years">{yearsExperience} Years</div>
                <div className="badge-hub">{companyName}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

