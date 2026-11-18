import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { Menu, X, Phone } from 'lucide-react';
import WhatsAppIcon from '../common/WhatsAppIcon';
import { useSettings } from '../../context/useSettings';
import { gsap, isReducedMotion } from '../../utils/gsapConfig';
import './Navbar.css';

export default function Navbar() {
  const { companyName, phone, getWhatsAppLink } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef(null);

  const toggleMenu = () => setMobileMenuOpen(prev => !prev);
  const closeMenu = () => setMobileMenuOpen(false);

  // Subtle entrance animation on initial mount
  useGSAP(() => {
    if (isReducedMotion()) return;

    gsap.fromTo('.header-inner',
      { y: -15, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.65,
        ease: 'power2.out',
        clearProps: 'opacity,transform',
      }
    );
  }, { scope: headerRef });

  // Close mobile menu on Escape key press & prevent background scroll when open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        closeMenu();
      }
    };

    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const whatsappNavUrl = getWhatsAppLink(
    `Hi ${companyName}, I would like to enquire about your interior design and interior work services.`
  );

  const phoneTel = `tel:${phone.replace(/\s+/g, '')}`;

  return (
    <header ref={headerRef} className="site-header">
      <div className="container header-inner">
        {/* Brand / Logo */}
        <Link to="/" className="brand-logo" onClick={closeMenu} aria-label={`${companyName} - Home`}>
          <img
            src="/Website_Logo.png"
            alt={companyName}
            className="brand-logo-img"
            width="170"
            height="46"
          />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav" aria-label="Main Navigation">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Home
          </NavLink>
          <NavLink to="/projects" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Projects
          </NavLink>
          <NavLink to="/services" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Services
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            About
          </NavLink>
          <NavLink to="/contact" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Contact
          </NavLink>
        </nav>

        {/* Header Actions */}
        <div className="header-actions">
          <a
            href={phoneTel}
            className="header-phone-link"
            aria-label={`Call ${companyName} at ${phone}`}
          >
            <Phone size={15} className="phone-icon" aria-hidden="true" />
            <span className="phone-text">{phone}</span>
          </a>

          <a
            href={whatsappNavUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp header-cta"
            aria-label={`Chat with ${companyName} on WhatsApp`}
            title="Chat on WhatsApp"
          >
            <WhatsAppIcon size={18} />
            <span className="header-cta-text">WhatsApp</span>
          </a>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="mobile-toggle-btn"
            onClick={toggleMenu}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-drawer"
            aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Navigation Menu'}
          >
            {mobileMenuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={closeMenu}>
          <div
            id="mobile-nav-drawer"
            className="mobile-menu-drawer"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
          >
            <div className="mobile-drawer-header">
              <Link to="/" onClick={closeMenu} aria-label={`${companyName} - Home`} className="mobile-drawer-logo-link">
                <img
                  src="/Website_Logo.png"
                  alt={companyName}
                  className="mobile-drawer-logo-img"
                  width="160"
                  height="44"
                />
              </Link>
            </div>

            <nav className="mobile-nav-links">
              <NavLink to="/" end className="mobile-link" onClick={closeMenu}>
                Home
              </NavLink>
              <NavLink to="/projects" className="mobile-link" onClick={closeMenu}>
                Completed Projects
              </NavLink>
              <NavLink to="/services" className="mobile-link" onClick={closeMenu}>
                Services & Trades
              </NavLink>
              <NavLink to="/about" className="mobile-link" onClick={closeMenu}>
                About Studio
              </NavLink>
              <NavLink to="/contact" className="mobile-link" onClick={closeMenu}>
                Contact & Enquiries
              </NavLink>
            </nav>

            <div className="mobile-cta-wrapper">
              <a
                href={whatsappNavUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp mobile-whatsapp-full"
                onClick={closeMenu}
              >
                <WhatsAppIcon size={20} />
                <span>Chat on WhatsApp</span>
              </a>

              <a
                href={phoneTel}
                className="btn btn-outline mobile-call-full"
                onClick={closeMenu}
              >
                <Phone size={17} />
                <span>Call {phone}</span>
              </a>

              <div className="mobile-area-note">
                Supervised Execution in Gurugram • Delhi • Noida
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
