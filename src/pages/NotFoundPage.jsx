import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home, Compass } from 'lucide-react';
import { COMPANY_INFO } from '../data/designer';
import './NotFoundPage.css';

export default function NotFoundPage() {
  return (
    <div className="not-found-page-root">
      <div className="container not-found-page-container">
        <div className="not-found-card">
          <div className="not-found-icon-wrap" aria-hidden="true">
            <ShieldAlert size={36} />
          </div>
          <span className="not-found-code">404</span>
          <h1 className="not-found-title">Page Not Found</h1>
          <p className="not-found-desc">
            The page you are looking for does not exist, has been removed, or the address was entered incorrectly.
          </p>

          <div className="not-found-actions">
            <Link to="/" className="btn btn-primary">
              <Home size={15} />
              <span>Return to Homepage</span>
            </Link>
            <Link to="/projects" className="btn btn-outline">
              <Compass size={15} />
              <span>Explore Portfolio</span>
            </Link>
          </div>

          <div className="not-found-footer-note">
            <span>{COMPANY_INFO.name} • {COMPANY_INFO.domain}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
