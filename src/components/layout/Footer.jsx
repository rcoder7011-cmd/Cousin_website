import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, ShieldCheck, Award } from 'lucide-react';
import WhatsAppIcon from '../common/WhatsAppIcon';
import { DESIGNER_INFO, getWhatsAppUrl } from '../../data/designer';
import './Footer.css';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  const footerWhatsApp = getWhatsAppUrl("Hi Rajabul, I am contacting you through your website for an interior consultation.");

  return (
    <footer className="site-footer">
      <div className="container footer-content">
        {/* Brand & Experience Focus */}
        <div className="footer-col brand-col">
          <div className="footer-brand-header">
            <h3 className="footer-brand-title">{DESIGNER_INFO.name}</h3>
            <span className="footer-brand-tagline">Interior Architecture & Site Execution</span>
          </div>
          <p className="footer-brand-desc">
            With over 10 years of experience in interior design, we focus on creating beautiful, functional, and thoughtfully designed spaces with direct on-site supervision across Gurugram, Delhi, and Noida.
          </p>
          <div className="footer-trust-tags">
            <div className="footer-trust-tag">
              <Award size={16} className="trust-tag-icon" />
              <span>10+ Years of Craftsmanship</span>
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

        {/* Coverage Areas */}
        <div className="footer-col">
          <h4 className="footer-heading">Service Regions</h4>
          <ul className="footer-areas-list">
            {DESIGNER_INFO.serviceAreas.map((area, idx) => (
              <li key={idx}>
                <MapPin size={15} className="area-icon" />
                <span>{area}</span>
              </li>
            ))}
          </ul>
          <p className="footer-subtext">On-site measurements and personal design consultations available across all listed regions.</p>
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
              aria-label="Send WhatsApp message to Rajabul Saifi"
            >
              <WhatsAppIcon size={20} />
              <span>Chat on WhatsApp</span>
            </a>
            <a
              href={`tel:${DESIGNER_INFO.contact.phone.replace(/\s+/g, '')}`}
              className="btn btn-outline footer-btn footer-btn-call"
              aria-label={`Call Rajabul Saifi at ${DESIGNER_INFO.contact.phone}`}
            >
              <Phone size={16} />
              <span>{DESIGNER_INFO.contact.phone}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p className="footer-credits">
            © {CURRENT_YEAR} {DESIGNER_INFO.name} — Interior Architecture & Turnkey Execution. 10+ Years of Experience.
          </p>
          <p className="footer-location-tag">
            Gurugram • Delhi • Noida
          </p>
        </div>
      </div>
    </footer>
  );
}
