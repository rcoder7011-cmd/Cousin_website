import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import {
  MapPin,
  Phone,
  ShieldCheck,
  Award,
  Globe,
  Mail
} from 'lucide-react';
import WhatsAppIcon from '../common/WhatsAppIcon';
import {
  InstagramIcon,
  FacebookIcon,
  YoutubeIcon,
  LinkedinIcon
} from '../common/SocialIcons';
import { useSettings } from '../../context/useSettings';
import { gsap, isReducedMotion } from '../../utils/gsapConfig';
import './Footer.css';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  const footerRef = useRef(null);
  const {
    companyName,
    phone,
    email,
    yearsExperience,
    getWhatsAppLink,
    footer,
    social
  } = useSettings();

  const footerWhatsApp = getWhatsAppLink(
    `Hi ${companyName}, I am contacting you through saifiinteriorhub.in for an interior design consultation.`
  );

  // Filter only configured social links
  const activeSocials = [
    { key: 'instagram', label: 'Instagram', url: social?.instagram, icon: InstagramIcon },
    { key: 'facebook', label: 'Facebook', url: social?.facebook, icon: FacebookIcon },
    { key: 'youtube', label: 'YouTube', url: social?.youtube, icon: YoutubeIcon },
    { key: 'linkedin', label: 'LinkedIn', url: social?.linkedin, icon: LinkedinIcon }
  ].filter(s => Boolean(s.url && s.url.trim()));

  const copyrightText = (footer?.copyright_text || '© {year} Saifi Interior Hub. All Rights Reserved.').replace('{year}', CURRENT_YEAR);
  const footerDesc = footer?.footer_description || `With over 10 years of experience in interior design and interior work, ${companyName} focuses on creating beautiful, functional, and thoughtfully designed residential and commercial spaces across Gurugram, Delhi, and Noida with direct on-site supervision.`;
  const footerAddress = footer?.footer_address || 'Gurugram • Delhi • Noida';

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
            <h3 className="footer-brand-title">{companyName}</h3>
            <span className="footer-brand-tagline">Interior Design and Interior Work</span>
          </div>
          <p className="footer-brand-desc">
            {footerDesc}
          </p>
          <div className="footer-trust-tags">
            <div className="footer-trust-tag">
              <Award size={16} className="trust-tag-icon" />
              <span>{yearsExperience} Years Company Experience</span>
            </div>
            <div className="footer-trust-tag">
              <ShieldCheck size={16} className="trust-tag-icon" />
              <span>Direct Supervision • Zero Middlemen</span>
            </div>
          </div>

          {/* Social Media Links (if configured and enabled) */}
          {footer?.show_social && activeSocials.length > 0 && (
            <div className="footer-social-row" style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
              {activeSocials.map(s => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.key}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-social-btn"
                    aria-label={`${companyName} on ${s.label}`}
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-accent, #b38838)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Icon size={16} />
                  </a>
                );
              })}
            </div>
          )}
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
            <li>
              <MapPin size={15} className="area-icon" />
              <span>{footerAddress}</span>
            </li>
          </ul>
          <div className="footer-web-details">
            <div className="footer-web-item">
              <Globe size={14} className="web-icon" />
              <a href="https://saifiinteriorhub.in" className="footer-domain-link">
                saifiinteriorhub.in
              </a>
            </div>
            <div className="footer-web-item">
              <Mail size={14} className="web-icon" />
              <a href={`mailto:${email}`} className="footer-email-link">
                {email}
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
              aria-label={`Send WhatsApp message to ${companyName}`}
            >
              <WhatsAppIcon size={20} />
              <span>Chat on WhatsApp</span>
            </a>
            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="btn btn-outline footer-btn footer-btn-call"
              aria-label={`Call ${companyName} at ${phone}`}
            >
              <Phone size={16} />
              <span>{phone}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p className="footer-credits">
            {copyrightText} (<a href="https://saifiinteriorhub.in" className="footer-credit-domain">saifiinteriorhub.in</a>) — {yearsExperience} Years of Interior Design and Interior Work Experience.
          </p>
          <p className="footer-location-tag">
            {footerAddress}
          </p>
        </div>
      </div>
    </footer>
  );
}
