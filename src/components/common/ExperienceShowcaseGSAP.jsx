import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Award, ShieldCheck, Hammer, MapPin } from 'lucide-react';
import { COMPANY_INFO } from '../../data/designer';
import './ExperienceShowcaseGSAP.css';

gsap.registerPlugin(ScrollTrigger);

export default function ExperienceShowcaseGSAP() {
  const containerRef = useRef(null);
  const counterRef = useRef(null);

  useGSAP(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      if (counterRef.current) counterRef.current.innerText = `${COMPANY_INFO.yearsOfExperience}+`;
      return;
    }

    // Timeline triggered on scroll into viewport
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 82%',
        toggleActions: 'play none none none',
      }
    });

    // 1. Counter ticker object
    const counterObj = { count: 0 };
    tl.to(counterObj, {
      count: COMPANY_INFO.yearsOfExperience,
      duration: 1.8,
      ease: 'power2.out',
      onUpdate: () => {
        if (counterRef.current) {
          counterRef.current.innerText = `${Math.floor(counterObj.count)}+`;
        }
      }
    }, 0);

    // 2. Animate stat cards with stagger
    tl.from('.gsap-stat-card', {
      y: 28,
      opacity: 0,
      duration: 0.7,
      stagger: 0.12,
      ease: 'power2.out'
    }, 0.2);

    // 3. Animate badge ring
    tl.from('.gsap-badge-glow', {
      scale: 0.85,
      opacity: 0,
      duration: 0.9,
      ease: 'back.out(1.7)'
    }, 0.1);

  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="experience-gsap-container">
      {/* Visual Badge Callout */}
      <div className="experience-gsap-header">
        <div className="gsap-badge-glow">
          <Award size={28} className="gsap-badge-icon" aria-hidden="true" />
          <div className="gsap-counter-wrapper">
            <span ref={counterRef} className="gsap-counter-number">
              {COMPANY_INFO.yearsOfExperience}+
            </span>
            <span className="gsap-counter-label">Years of Company Experience</span>
          </div>
        </div>
        <p className="gsap-header-desc">
          Established as a dedicated interior design and interior work practice, <strong>{COMPANY_INFO.name}</strong> brings more than 10 years of hands-on site execution, space planning, and artisan craftsmanship across Delhi NCR.
        </p>
      </div>

      {/* 4 Interactive Key Milestones */}
      <div className="gsap-stats-grid">
        <div className="gsap-stat-card">
          <div className="gsap-stat-icon-wrap" aria-hidden="true">
            <Award size={20} />
          </div>
          <div className="gsap-stat-num">10+</div>
          <div className="gsap-stat-title">Years Experience</div>
          <div className="gsap-stat-desc">Over a decade of trusted interior design & interior work</div>
        </div>

        <div className="gsap-stat-card">
          <div className="gsap-stat-icon-wrap" aria-hidden="true">
            <Hammer size={20} />
          </div>
          <div className="gsap-stat-num">150+</div>
          <div className="gsap-stat-title">Projects Executed</div>
          <div className="gsap-stat-desc">Flats, villas, modular setups & corporate cabins</div>
        </div>

        <div className="gsap-stat-card">
          <div className="gsap-stat-icon-wrap" aria-hidden="true">
            <ShieldCheck size={20} />
          </div>
          <div className="gsap-stat-num">100%</div>
          <div className="gsap-stat-title">Direct Supervision</div>
          <div className="gsap-stat-desc">Personal site management with zero middleman layers</div>
        </div>

        <div className="gsap-stat-card">
          <div className="gsap-stat-icon-wrap" aria-hidden="true">
            <MapPin size={20} />
          </div>
          <div className="gsap-stat-num">3 Hubs</div>
          <div className="gsap-stat-title">Delhi NCR Coverage</div>
          <div className="gsap-stat-desc">Active operations across Gurugram, Delhi & Noida</div>
        </div>
      </div>
    </div>
  );
}
