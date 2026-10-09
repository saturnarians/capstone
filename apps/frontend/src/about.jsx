import { useState } from 'react';
import './style.css';

export default function About({ onNavigateToHome, onNavigateToDashboard }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="about-root">
      {/* HEADER / NAVBAR SECTION */}
      <header className="header" id="header">
        <div className="container navbar">
          <a
            href="#home"
            className="logo"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigateToHome) onNavigateToHome();
            }}
          >
            <span className="logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="24" height="24" rx="6" fill="#253880" />
                <path d="M7 12L10 15L17 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="logo-text">TS-CRM</span>
          </a>

          <div className={`nav-collapse ${mobileMenuOpen ? 'mobile-open' : ''}`} id="navCollapse">
            <nav className="nav-links">
              <a
                href="#home"
                className="nav-item"
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigateToHome) onNavigateToHome();
                }}
              >
                Home
              </a>
              <a href="#about" className="nav-item active">
                About
              </a>
            </nav>

            <div className="nav-actions">
              <button
                className="btn-primary"
                onClick={() => {
                  if (onNavigateToDashboard) onNavigateToDashboard();
                }}
              >
                Launch Dashboard
              </button>
            </div>
          </div>

          <button
            className={`menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
            id="menuToggle"
            aria-label="Toggle Navigation Menu"
            onClick={() => setMobileMenuOpen(prev => !prev)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      {/* ABOUT HERO SECTION */}
      <section className="hero-section" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center' }}>
        <div className="container">
          <span className="badge badge-blue">CAPSTONE PROJECT</span>
          <h1 className="hero-title" style={{ marginTop: '12px' }}>
            About <span className="text-blue">TS-CRM</span>
          </h1>
          <p className="hero-description" style={{ maxWidth: '700px', marginTop: '16px' }}>
            TS-CRM is designed to solve customer information fragmentation for small business owners. Built to replace notebooks, unorganized spreadsheets, and scattered messaging apps with a unified, modern web application.
          </p>
          <div style={{ marginTop: '24px' }}>
            <button
              className="btn-primary btn-large"
              onClick={() => {
                if (onNavigateToDashboard) onNavigateToDashboard();
              }}
            >
              Open Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER SECTION */}
      <footer className="footer">
        <div className="container">
          <div className="footer-bottom">
            <p className="copyright">© 2026 TS-CRM SOLUTIONS</p>
            <div className="legal-links">
              <a href="#privacy">PRIVACY POLICY</a>
              <a href="#terms">TERMS OF SERVICE</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
