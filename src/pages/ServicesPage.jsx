import React from 'react';
import { CheckCircle2, Award, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import WhatsAppIcon from '../components/common/WhatsAppIcon';
import { SERVICES } from '../data/services';
import { getWhatsAppUrl } from '../data/designer';
import './ServicesPage.css';

export default function ServicesPage() {
  const consultWhatsApp = getWhatsAppUrl("Hi Rajabul, I would like to schedule an interior design and execution consultation.");

  return (
    <div className="services-page">
      {/* Header Banner */}
      <section className="page-header-wrapper" aria-label="Services header">
        <div className="container">
          <div className="page-header-inner">
            <span className="badge">
              <Award size={14} className="badge-icon" />
              <span>10+ Years Experience • All Trades In-House</span>
            </span>
            <h1 className="page-main-title">Interior Design & Execution Trades</h1>
            <p className="page-main-desc">
              From signature living spaces and modular kitchens to full turnkey flat and villa execution across Gurugram, Delhi, and Noida. Supervised directly on-site by Rajabul Saifi.
            </p>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="services-list-grid" aria-label="Execution services list">
          {SERVICES.map((service, index) => {
            const serviceWhatsAppUrl = getWhatsAppUrl(
              `Hi Rajabul, I would like to enquire about "${service.title}" services for my site in Delhi NCR.`
            );

            return (
              <article key={service.id} className="service-detail-card">
                {service.coverImage && (
                  <div className="service-detail-media">
                    <img
                      src={service.coverImage}
                      alt={service.title}
                      loading="lazy"
                      decoding="async"
                      width="600"
                      height="380"
                      className="service-detail-img"
                    />
                    <div className="service-detail-badges">
                      <span className="service-detail-num">0{index + 1}</span>
                      {service.tag && <span className="service-detail-tag">{service.tag}</span>}
                    </div>
                  </div>
                )}

                <div className="service-detail-content">
                  <h2 className="service-detail-title">{service.title}</h2>
                  <p className="service-detail-desc">{service.description}</p>

                  <div className="service-scope-wrapper">
                    <div className="service-scope-heading">
                      Execution Scope & Specifications:
                    </div>
                    <ul className="service-scope-items">
                      {service.scope.map((item, idx) => (
                        <li key={idx} className="service-scope-item">
                          <CheckCircle2 size={16} className="service-check-icon" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="service-card-action">
                    <a
                      href={serviceWhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-whatsapp service-card-btn"
                      aria-label={`Enquire with Rajabul Saifi about ${service.title}`}
                    >
                      <WhatsAppIcon size={18} />
                      <span>Enquire for this Service</span>
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Bottom Consultation Banner */}
        <div className="services-consult-banner">
          <div className="services-consult-text">
            <h3>Need a Custom Combination of Services?</h3>
            <p>
              Whether you need only modular woodwork and false ceiling or full turnkey delivery from bare shell, we customize execution to your exact floor plan and budget.
            </p>
          </div>
          <div className="services-consult-actions">
            <a
              href={consultWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp"
            >
              <WhatsAppIcon size={20} />
              <span>Discuss Your Floor Plan</span>
            </a>
            <Link to="/contact" className="btn btn-outline">
              <span>Contact Studio</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
