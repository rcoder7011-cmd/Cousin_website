import React from 'react';
import WhatsAppIcon from './WhatsAppIcon';
import { COMPANY_INFO, getWhatsAppUrl } from '../../data/designer';
import './WhatsAppButton.css';

/**
 * Floating WhatsApp CTA Button
 * Enables direct 1-click messaging from any page/screen.
 */
export default function WhatsAppButton() {
  const whatsappUrl = getWhatsAppUrl(
    `Hi ${COMPANY_INFO.name}, I came across ${COMPANY_INFO.domain} and would like to discuss an interior project in Delhi NCR.`
  );

  return (
    <aside aria-label="Quick WhatsApp Contact" className="whatsapp-floating-container">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-floating-btn"
        aria-label={`Chat directly with ${COMPANY_INFO.name} on WhatsApp`}
        title={`Chat directly with ${COMPANY_INFO.name} on WhatsApp`}
      >
        <span className="whatsapp-pulse" aria-hidden="true"></span>
        <WhatsAppIcon size={28} className="whatsapp-icon" />
        <span className="whatsapp-label">Chat on WhatsApp</span>
      </a>
    </aside>
  );
}
