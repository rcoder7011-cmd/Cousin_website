import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { MapPin, Phone, ShieldCheck, Award, Globe, Mail } from 'lucide-react';
import WhatsAppIcon from '../common/WhatsAppIcon';
import { COMPANY_INFO, getWhatsAppUrl } from '../../data/designer';
import { gsap, isReducedMotion } from '../../utils/gsapConfig';
import './Footer.css';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  const footerRef = useRef(null);
  const footerWhatsApp = getWhatsAppUrl(`Hi ${COMPANY_INFO.name}, I am contacting you through saifiinteriorhub.in for an interior design consultation.`);

  useGSAP(() => {
    if (isReducedMotion()) return;

    gsap.from('.footer-col', {
      scrollTrigger: {
        trigger: footerRef.current,
        start: 'top 88%',
        once: true,
      },
      y: 25,
      opacity: 0,
      duration: 0.75,
      stagger: 0.1,
      ease: 'power2.out',
    });
  }, { scope: footerRef });

  return (
    <footer ref={footerRef} className="site-footer">
      <div className="container footer-content">
        {/* Brand & Experience Focus */}
        <div className="footer-col brand-col">
          <div className="footer-brand-header">
            <h3 className="footer-brand-title">{COMPANY_INFO.name}</h3>
            <span className="footer-brand-tagline">Interior Design and Interior Work</span>
          </div>
          <p className="footer-brand-desc">
            With over 10 years of experience in interior design and interior work, <strong>{COMPANY_INFO.name}</strong> focuses on creating beautiful, functional, and thoughtfully designed residential and commercial spaces across Gurugram, Delhi, and Noida with direct on-site supervision.
          </p>
          <div className="footer-trust-tags">
            <div className="footer-trust-tag">
              <Award size={16} className="trust-tag-icon" />
              <span>10+ Years Company Experience</span>
            </div>
            <div className="footer-trust-tag">
              <ShieldCheck size={16} className="trust-tag-icon" />
              <span>Direct Supervision • Zero Middlemen</span>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-col">
          <h4 className="footer-heading">Studio Navigation</h4>
          <ul className="footer-links">
            <li><Link to="/">Home Overview</Link></li>
            <li><Link to="/projects">Completed Projects</Link></li>
            <li><Link to="/services">Interior Design Services</Link></li>
            <li><Link to="/about">About & Experience</Link></li>
            <li><Link to="/contact">Consultation & Enquiries</Link></li>
          </ul>
        </div>

        {/* Coverage Areas & Official Web Info */}
        <div className="footer-col">
          <h4 className="footer-heading">Service Regions</h4>
          <ul className="footer-areas-list">
            {COMPANY_INFO.serviceAreas.map((area, idx) => (
              <li key={idx}>
                <MapPin size={15} className="area-icon" />
                <span>{area}</span>
              </li>
            ))}
          </ul>
          <div className="footer-web-details">
            <div className="footer-web-item">
              <Globe size={14} className="web-icon" />
              <a href={COMPANY_INFO.websiteUrl} className="footer-domain-link">
                {COMPANY_INFO.domain}
              </a>
            </div>
            <div className="footer-web-item">
              <Mail size={14} className="web-icon" />
              <a href={`mailto:${COMPANY_INFO.contact.email}`} className="footer-email-link">
                {COMPANY_INFO.contact.email}
              </a>
            </div>
          </div>
        </div>

        {/* Direct Contact */}
        <div className="footer-col contact-col">
          <h4 className="footer-heading">Direct Reach</h4>
          <p className="footer-subtext">Have an upcoming flat, villa, or office project? Discuss floor plans and get direct estimates:</p>
          <div className="footer-cta-group">
            <a
              href={footerWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp footer-btn"
              aria-label={`Send WhatsApp message to ${COMPANY_INFO.name}`}
            >
              <WhatsAppIcon size={20} />
              <span>Chat on WhatsApp</span>
            </a>
            <a
              href={`tel:${COMPANY_INFO.contact.phone.replace(/\s+/g, '')}`}
              className="btn btn-outline footer-btn footer-btn-call"
              aria-label={`Call ${COMPANY_INFO.name} at ${COMPANY_INFO.contact.phone}`}
            >
              <Phone size={16} />
              <span>{COMPANY_INFO.contact.phone}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p className="footer-credits">
            © {CURRENT_YEAR} {COMPANY_INFO.name} (<a href={COMPANY_INFO.websiteUrl} className="footer-credit-domain">{COMPANY_INFO.domain}</a>) — 10+ Years of Interior Design and Interior Work Experience.
          </p>
          <p className="footer-location-tag">
            Gurugram • Delhi • Noida
          </p>
        </div>
      </div>
    </footer>
  );
}
