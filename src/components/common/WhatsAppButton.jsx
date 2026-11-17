import React from 'react';
import WhatsAppIcon from './WhatsAppIcon';
import { useSettings } from '../../context/useSettings';
import './WhatsAppButton.css';

/**
 * Floating WhatsApp CTA Button
 * Enables direct 1-click messaging from any page/screen using dynamic settings.
 */
export default function WhatsAppButton() {
  const { companyName, getWhatsAppLink } = useSettings();
  const whatsappUrl = getWhatsAppLink(
    `Hi ${companyName}, I came across saifiinteriorhub.in and would like to discuss an interior project in Delhi NCR.`
  );

  return (
    <aside aria-label="Quick WhatsApp Contact" className="whatsapp-floating-container">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-floating-btn"
        aria-label={`Chat directly with ${companyName} on WhatsApp`}
        title={`Chat directly with ${companyName} on WhatsApp`}
      >
        <span className="whatsapp-pulse" aria-hidden="true"></span>
        <WhatsAppIcon size={28} className="whatsapp-icon" />
        <span className="whatsapp-label">Chat on WhatsApp</span>
      </a>
    </aside>
  );
}
