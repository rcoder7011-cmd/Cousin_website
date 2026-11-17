import React, { useState, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { Phone, MapPin, Award, CheckCircle2, Globe, Mail, ExternalLink } from 'lucide-react';
import WhatsAppIcon from '../components/common/WhatsAppIcon';
import { useSettings } from '../context/useSettings';
import { useSEO } from '../utils/useSEO';
import { gsap, isReducedMotion } from '../utils/gsapConfig';
import './ContactPage.css';

export default function ContactPage() {
  const {
    companyName,
    phone,
    email,
    yearsExperience,
    address,
    contact,
    getWhatsAppLink
  } = useSettings();

  useSEO({ pageKey: 'contact' });

  const pageRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    location: 'Gurugram',
    propertyType: '3BHK Apartment',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleWhatsAppSubmit = (e) => {
    e.preventDefault();
    const formattedMessage = `Hi ${companyName}, my name is ${formData.name || 'a client'}. I have a ${formData.propertyType} in ${formData.location}. ${formData.message ? `Details: ${formData.message}` : 'I would like to discuss interior design and interior work.'}`;
    window.open(getWhatsAppLink(formattedMessage), '_blank');
  };

  const directWhatsApp = getWhatsAppLink(
    `Hi ${companyName}, I would like to schedule an on-site interior design consultation via saifiinteriorhub.in.`
  );

  useGSAP(() => {
    if (isReducedMotion()) return;

    // Header reveal
    gsap.from('.page-header-inner > *', {
      y: 25,
      opacity: 0,
      duration: 0.7,
      stagger: 0.1,
      ease: 'power2.out',
    });

    // Contact info and form entrance
    gsap.from('.contact-info-card', {
      x: -25,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out',
      delay: 0.2,
    });

    gsap.from('.enquiry-form-card', {
      x: 25,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out',
      delay: 0.3,
    });
  }, { scope: pageRef });

  return (
    <div ref={pageRef} className="contact-page">
      {/* Header Banner */}
      <section className="page-header-wrapper" aria-label="Contact header">
        <div className="container">
          <div className="page-header-inner">
            <span className="badge">
              <Award size={14} className="badge-icon" />
              <span>{companyName} • {yearsExperience} Years Experience</span>
            </span>
            <h1 className="page-main-title">Start Your Interior Project</h1>
            <p className="page-main-desc">
              {contact?.contact_description || `Connect directly with ${companyName} (saifiinteriorhub.in) for on-site visits, architectural space discussions, and transparent cost estimates across Gurugram, Delhi, and Noida.`}
            </p>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="contact-layout-grid">
          {/* Direct Reach Card */}
          <div className="contact-info-card">
            <span className="section-eyebrow">Direct Touchpoints</span>
            <h2 className="contact-info-title">Studio Contact & Reach</h2>
            <p className="contact-info-subtitle">
              Have a floor plan or architectural layout ready? {companyName} provides direct designer oversight without sales intermediaries.
            </p>

            <div className="contact-methods-list">
              <div className="contact-method-item">
                <div className="contact-method-icon-wa" aria-hidden="true">
                  <WhatsAppIcon size={22} />
                </div>
                <div>
                  <div className="contact-method-label">WhatsApp (Priority Response)</div>
                  <a
                    href={directWhatsApp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-method-val-wa"
                    aria-label={`Chat directly on WhatsApp with ${companyName}`}
                  >
                    Chat Directly on WhatsApp
                  </a>
                </div>
              </div>

              <div className="contact-method-item">
                <div className="contact-method-icon-phone" aria-hidden="true">
                  <Phone size={20} />
                </div>
                <div>
                  <div className="contact-method-label">Direct Phone Call</div>
                  <a
                    href={`tel:${phone.replace(/\s+/g, '')}`}
                    className="contact-method-val-phone"
                    aria-label={`Call ${companyName} at ${phone}`}
                  >
                    {phone}
                  </a>
                </div>
              </div>

              <div className="contact-method-item">
                <div className="contact-method-icon-map" aria-hidden="true">
                  <MapPin size={20} />
                </div>
                <div>
                  <div className="contact-method-label">Active Execution Regions / Address</div>
                  <div className="contact-method-val-loc">
                    {address}
                  </div>
                  {contact?.google_maps_url && (
                    <a
                      href={contact.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.78rem', color: 'var(--color-accent)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}
                    >
                      <span>View on Google Maps</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>

              <div className="contact-method-item">
                <div className="contact-method-icon-web" aria-hidden="true">
                  <Globe size={20} />
                </div>
                <div>
                  <div className="contact-method-label">Official Website Domain</div>
                  <a href="https://saifiinteriorhub.in" className="contact-method-val-web">
                    saifiinteriorhub.in
                  </a>
                </div>
              </div>

              <div className="contact-method-item">
                <div className="contact-method-icon-web" aria-hidden="true">
                  <Mail size={20} />
                </div>
                <div>
                  <div className="contact-method-label">Official Email</div>
                  <a href={`mailto:${email}`} className="contact-method-val-web">
                    {email}
                  </a>
                </div>
              </div>
            </div>

            <div className="contact-note-box">
              <div className="contact-note-header">
                <CheckCircle2 size={16} className="note-icon" />
                <span className="contact-note-title">On-Site Measurement Visits:</span>
              </div>
              <p className="contact-note-desc">
                Site visits and initial architectural walkthroughs are scheduled directly by {companyName} across Delhi NCR at a mutually convenient time.
              </p>
            </div>
          </div>

          {/* WhatsApp Assisted Form */}
          <form
            onSubmit={handleWhatsAppSubmit}
            className="enquiry-form-card"
            aria-label={`Send project enquiry to ${companyName} via WhatsApp`}
          >
            <div className="enquiry-form-header">
              <span className="section-eyebrow">Quick Inquiry</span>
              <h2 className="enquiry-form-title">Send Project Specifications</h2>
              <p className="enquiry-form-desc">
                Generates a pre-formatted consultation request and connects directly to {companyName} on WhatsApp.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="contact-name" className="form-label">
                Your Name *
              </label>
              <input
                id="contact-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Amit Sharma"
                required
                className="form-input"
              />
            </div>

            <div className="form-grid-two">
              <div className="form-group">
                <label htmlFor="contact-location" className="form-label">
                  Project Location *
                </label>
                <select
                  id="contact-location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="Gurugram">Gurugram</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Noida">Noida</option>
                  <option value="Greater Noida">Greater Noida</option>
                  <option value="Other NCR">Other Delhi NCR</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="contact-property-type" className="form-label">
                  Space Type *
                </label>
                <select
                  id="contact-property-type"
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="2BHK Apartment">2BHK Apartment</option>
                  <option value="3BHK Apartment">3BHK Apartment</option>
                  <option value="4BHK+ Luxury Flat">4BHK+ Luxury Flat</option>
                  <option value="Independent House / Villa">Villa / House</option>
                  <option value="Commercial / Office Suite">Commercial / Office</option>
                  <option value="Modular Kitchen & Wardrobes Only">Modular Kitchen & Wardrobes Only</option>
                  <option value="Living Room & False Ceiling">Living Room & False Ceiling</option>
                  <option value="Full Turnkey Home">Full Turnkey Home (Bare Shell)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="contact-message" className="form-label">
                Project Scope or Notes (Optional)
              </label>
              <textarea
                id="contact-message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={3}
                placeholder="Mention specific details like possession date, false ceiling, wood panelling, marble work, etc."
                className="form-textarea"
              />
            </div>

            <button
              type="submit"
              className="btn btn-whatsapp enquiry-submit-btn"
              aria-label={`Connect with ${companyName} on WhatsApp`}
            >
              <WhatsAppIcon size={22} />
              <span>Connect on WhatsApp</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
