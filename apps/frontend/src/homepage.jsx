import React, { useState } from 'react';
import './style.css';

export default function HomePage({ onNavigateToDashboard, onNavigateToAbout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'demo' | 'contact' | null
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const [demoForm, setDemoForm] = useState({ name: '', contact: '' });
  const [contactForm, setContactForm] = useState({ email: '', message: '' });

  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const openModal = (modalName, e) => {
    if (e) e.preventDefault();
    setActiveModal(modalName);
    closeMobileMenu();
  };

  const closeModal = (e) => {
    if (e) e.preventDefault();
    setActiveModal(null);
    setDemoSubmitted(false);
    setContactSubmitted(false);
  };

  const handleDemoSubmit = (e) => {
    e.preventDefault();
    setDemoSubmitted(true);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSubmitted(true);
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterSubscribed(true);
      setNewsletterEmail('');
      setTimeout(() => setNewsletterSubscribed(false), 4000);
    }
  };

  const scrollToSection = (id, e) => {
    if (e) e.preventDefault();
    closeMobileMenu();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="homepage-root">
      {/* ==========================================
          HEADER / NAVBAR SECTION
          ========================================== */}
      <header className="header" id="header">
        <div className="container navbar">
          {/* Brand Logo */}
          <a
            href="#hero"
            onClick={(e) => scrollToSection('hero', e)}
            className="logo"
          >
            <span className="logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="24" height="24" rx="6" fill="#253880" />
                <path d="M7 12L10 15L17 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="logo-text">TS-CRM</span>
          </a>

          {/* Collapsible Navigation Container */}
          <div className={`nav-collapse ${mobileMenuOpen ? 'mobile-open' : ''}`} id="navCollapse">
            <nav className="nav-links">
              <a
                href="#hero"
                className="nav-item active"
                onClick={(e) => scrollToSection('hero', e)}
              >
                Home
              </a>
              <a
                href="#about"
                className="nav-item"
                id="navAbout"
                onClick={(e) => {
                  if (onNavigateToAbout) {
                    e.preventDefault();
                    onNavigateToAbout();
                  } else {
                    openModal('about', e);
                  }
                }}
              >
                About
              </a>
              <a
                href="#problem"
                className="nav-item"
                onClick={(e) => scrollToSection('problem', e)}
              >
                Features
              </a>
              <a
                href="#pricing"
                className="nav-item"
                onClick={(e) => scrollToSection('pricing', e)}
              >
                Pricing
              </a>
            </nav>

            {/* Navigation Action Buttons: Sign In & Start Free Trial */}
            <div className="nav-actions">
              {/* =================================================================
                  SIGN IN LINK (Links to collaborator's ./login.jsx)
                  ================================================================= */}
              <a
                href="./login.jsx"
                className="btn-text"
              >
                Sign In
              </a>

              {/* =================================================================
                  START FREE TRIAL LINK (Links to collaborator's ./register.jsx)
                  ================================================================= */}
              <a
                href="./register.jsx"
                className="btn-primary"
              >
                Start Free Trial
              </a>
            </div>
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            className={`menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
            id="menuToggle"
            aria-label="Toggle Navigation Menu"
            onClick={toggleMobileMenu}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      {/* ==========================================
          HERO SECTION
          ========================================== */}
      <section className="hero-section" id="hero">
        <div className="container hero-container">
          {/* Left Hero Content */}
          <div className="hero-content">
            <h1 className="hero-title">
              Your customers. <br />
              Your conversations. <br />
              <span className="text-blue">All in one place.</span>
            </h1>
            <p className="hero-description">
              All in one place. Keep customer information, interactions, and follow-ups organized without relying on scattered notebooks, spreadsheets, phone contacts, or WhatsApp messages.
            </p>
            <div className="hero-buttons">
              {/* =================================================================
                  GET STARTED TODAY BUTTON (Links to collaborator's ./register.jsx)
                  ================================================================= */}
              <a
                href="./register.jsx"
                className="btn-primary btn-large"
              >
                Get Started Today
              </a>
              <a
                href="#demo"
                className="btn-secondary btn-large"
                onClick={(e) => openModal('demo', e)}
              >
                <span className="play-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                Request Demo
              </a>
            </div>
          </div>

          {/* Right Hero Image / Mockup Dashboard */}
          <div className="hero-image-wrapper">
            <div className="dashboard-mockup">
              <div className="mockup-header">
                <div className="window-dots">
                  <span className="dot dot-red"></span>
                  <span className="dot dot-yellow"></span>
                  <span className="dot dot-green"></span>
                </div>
                <div className="mockup-search">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
              </div>

              <div className="mockup-stats">
                <div className="stat-card">
                  <span className="stat-label">ACTIVE USERS</span>
                  <div className="stat-value">1,284</div>
                  <span className="badge badge-green">+12.5%</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">CONVERSION</span>
                  <div className="stat-value">24.8%</div>
                  <span className="badge badge-orange">+2.1%</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">PIPELINE</span>
                  <div className="stat-value">$4.2M</div>
                  <span className="badge badge-blue">Active</span>
                </div>
              </div>

              <div className="mockup-interactions">
                <div className="interactions-header">
                  <span>RECENT INTERACTIONS</span>
                  <span className="minus-icon">−</span>
                </div>
                <div className="interaction-item">
                  <div className="user-info">
                    <div className="avatar avatar-blue">JD</div>
                    <span className="user-name">Jane Doe – Acme Corp</span>
                  </div>
                  <span className="status-badge status-green">QUALIFIED</span>
                </div>
                <div className="interaction-item">
                  <div className="user-info">
                    <div className="avatar avatar-orange">JS</div>
                    <span className="user-name">John Smith – Global Tech</span>
                  </div>
                  <span className="status-badge status-orange">NEGOTIATION</span>
                </div>
              </div>
            </div>

            <div className="floating-badge">
              <div className="badge-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="badge-text">
                <strong>Pipeline Synced</strong>
                <p>Real-time updates active</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          PROBLEM & SOLUTION SECTION ("Tame the Chaos")
          ========================================== */}
      <section className="problem-section" id="problem">
        <div className="container problem-container">
          <div className="problem-left">
            <h2 className="section-title">
              Tame the <span className="text-danger">Chaos</span>
            </h2>
            <p className="section-text">
              As your business grows, customer information can end up everywhere (in notebooks, spreadsheets, phone contacts, emails, and WhatsApp conversations). That makes it easy to lose track of conversations and forget when you need to follow up.
            </p>

            <div className="solution-card">
              <h3 className="solution-title">The Solution: TS-CRM brings it together.</h3>
              <p className="solution-text">
                TS-CRM is the single source of truth for your small business customer management.
              </p>
              <div className="trusted-box">
                <div className="avatar-stack">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                    alt="User Avatar 1"
                    className="avatar-img"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
                    alt="User Avatar 2"
                    className="avatar-img"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"
                    alt="User Avatar 3"
                    className="avatar-img"
                  />
                </div>
                <span className="trusted-text">Trusted by 2,000+ business owners</span>
              </div>
            </div>
          </div>

          <div className="problem-right">
            <div className="feature-card">
              <div className="card-icon icon-red">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className="card-content">
                <h4 className="card-title">Scattered information</h4>
                <p className="card-description">Customer details live across different places, making it hard to find what you need.</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="card-icon icon-red">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <div className="card-content">
                <h4 className="card-title">Missed follow-ups</h4>
                <p className="card-description">Important customers can slip through the cracks without a central reminder system.</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="card-icon icon-red">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              </div>
              <div className="card-content">
                <h4 className="card-title">Lost context</h4>
                <p className="card-description">It becomes difficult to remember what was discussed and when as your client list grows.</p>
              </div>
            </div>

            <div className="feature-card card-highlight">
              <div className="card-icon icon-blue">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="card-content">
                <h4 className="card-title text-navy">One organized workspace</h4>
                <p className="card-description">Keep your customers, interactions, and follow-ups together in one beautiful view.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          WORKFLOW / STEPS SECTION
          ========================================== */}
      <section className="steps-section" id="workflow">
        <div className="container">
          <div className="steps-header">
            <h2 className="steps-title">
              From scattered information to <br /> organized relationships.
            </h2>
            <p className="steps-subtitle">A simple workflow designed for efficiency.</p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <h3 className="step-card-title">Add your customers</h3>
              <p className="step-card-text">Create a customer record with contact and business info in seconds.</p>
            </div>

            <div className="step-card">
              <div className="step-number">02</div>
              <h3 className="step-card-title">Record interactions</h3>
              <p className="step-card-text">Keep conversations and notes attached to the right customer profile.</p>
            </div>

            <div className="step-card">
              <div className="step-number">03</div>
              <h3 className="step-card-title">Create follow-ups</h3>
              <p className="step-card-text">Set a follow-up and due date to ensure you never miss a vital deal.</p>
            </div>

            <div className="step-card">
              <div className="step-number">04</div>
              <h3 className="step-card-title">Stay on top</h3>
              <p className="step-card-text">Use your dashboard to see exactly what needs your attention today.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          PRICING SECTION
          ========================================== */}
      <section className="pricing-section" id="pricing">
        <div className="container">
          <div className="pricing-header">
            <h2 className="section-title">
              Simple, Transparent <span className="text-blue">Pricing</span>
            </h2>
            <p className="section-text">Choose the plan that fits your growing small business needs.</p>
          </div>
          <div className="pricing-grid">
            <div className="price-card">
              <h3 className="price-title">Starter</h3>
              <div className="price-amount">
                $0<span>/month</span>
              </div>
              <p className="price-desc">Perfect for solo entrepreneurs testing TS-CRM.</p>
              <ul className="price-features">
                <li>Up to 100 Contacts</li>
                <li>Basic Interactions Log</li>
                <li>Email Reminders</li>
              </ul>
              <a
                href="./register.jsx"
                className="btn-secondary"
              >
                Start Free
              </a>
            </div>

            <div className="price-card price-featured">
              <div className="popular-badge">MOST POPULAR</div>
              <h3 className="price-title">Growth</h3>
              <div className="price-amount">
                $19<span>/month</span>
              </div>
              <p className="price-desc">Ideal for small teams scaling customer management.</p>
              <ul className="price-features">
                <li>Unlimited Contacts</li>
                <li>Full Interaction History</li>
                <li>Pipeline Real-Time Sync</li>
                <li>Priority Support</li>
              </ul>
              <a
                href="./register.jsx"
                className="btn-primary"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          CALL TO ACTION (CTA) BANNER SECTION
          ========================================== */}
      <section className="cta-section" id="cta">
        <div className="container">
          <div className="cta-banner">
            <div className="cta-watermark">
              <svg width="140" height="100" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>

            <h2 className="cta-title">
              Ready to get your customer <br /> relationships organized?
            </h2>
            <p className="cta-text">
              Join thousands of small business owners who are growing faster with CRM Core. No credit card required.
            </p>
            <div className="cta-buttons">
              <a
                href="./register.jsx"
                className="btn-white"
              >
                Get Started Free
              </a>
              <a
                href="#contact"
                className="btn-translucent"
                onClick={(e) => openModal('contact', e)}
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          FOOTER SECTION
          ========================================== */}
      <footer className="footer" id="footer">
        <div className="container">
          <div className="footer-top">
            <div className="footer-col footer-brand">
              <a href="#hero" onClick={(e) => scrollToSection('hero', e)} className="logo">
                <span className="logo-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="24" height="24" rx="6" fill="#253880" />
                    <path d="M7 12L10 15L17 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="logo-text">TS-CRM</span>
              </a>
              <p className="footer-description">
                The simple, no-nonsense CRM built specifically for growing small businesses who value their customer relationships.
              </p>
              <div className="social-links">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                  </svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="footer-col">
              <h4 className="footer-col-title">PRODUCT</h4>
              <ul className="footer-links">
                <li><a href="#problem" onClick={(e) => scrollToSection('problem', e)}>Features</a></li>
                <li><a href="#workflow" onClick={(e) => scrollToSection('workflow', e)}>How It Works</a></li>
                <li><a href="#pricing" onClick={(e) => scrollToSection('pricing', e)}>Pricing</a></li>
                <li><a href="#cta" onClick={(e) => scrollToSection('cta', e)}>Integrations</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4 className="footer-col-title">COMPANY</h4>
              <ul className="footer-links">
                <li>
                  <a
                    href="#about"
                    onClick={(e) => {
                      if (onNavigateToAbout) {
                        e.preventDefault();
                        onNavigateToAbout();
                      } else {
                        openModal('about', e);
                      }
                    }}
                  >
                    About Us
                  </a>
                </li>
                <li><a href="#contact" onClick={(e) => openModal('contact', e)}>Contact</a></li>
                <li><a href="#hero" onClick={(e) => scrollToSection('hero', e)}>Careers</a></li>
                <li><a href="#hero" onClick={(e) => scrollToSection('hero', e)}>Blog</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4 className="footer-col-title">NEWSLETTER</h4>
              <p className="newsletter-text">Get enterprise growth insights.</p>
              {newsletterSubscribed ? (
                <p style={{ color: 'var(--color-primary-soft)', fontSize: '0.9rem', fontWeight: 600 }}>
                  ✓ Thank you for subscribing!
                </p>
              ) : (
                <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
                  <input
                    type="email"
                    className="newsletter-input"
                    placeholder="Work email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    required
                  />
                  <button type="submit" className="newsletter-btn" aria-label="Subscribe">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="footer-bottom">
            <p className="copyright">© 2026 TS-CRM SOLUTIONS</p>
            <div className="legal-links">
              <a href="#privacy" onClick={(e) => { e.preventDefault(); alert('Privacy Policy: TS-CRM respects your data privacy.'); }}>
                PRIVACY POLICY
              </a>
              <a href="#terms" onClick={(e) => { e.preventDefault(); alert('Terms of Service: Standard SaaS terms apply.'); }}>
                TERMS OF SERVICE
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ==========================================
          MODALS SECTION
          ========================================== */}

      {/* 1. ABOUT MODAL */}
      {activeModal === 'about' && (
        <div className="modal-overlay" style={{ display: 'flex' }} onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              &times;
            </button>
            <div className="modal-header">
              <span className="badge badge-blue">CAPSTONE PROJECT</span>
              <h2 className="modal-title">
                About <span className="text-blue">TS-CRM</span>
              </h2>
            </div>
            <div className="modal-body">
              <p>
                <strong>TS-CRM</strong> is a lightweight, intuitive Customer Relationship Management system built specifically for small businesses. Designed to help business owners eliminate scattered notebooks, lost messages, and missed client follow-ups.
              </p>
              <h4 className="modal-subtitle">Core Objectives:</h4>
              <ul className="modal-list">
                <li><strong>Single Source of Truth:</strong> Consolidate customer contact records into one clean view.</li>
                <li><strong>Interaction History:</strong> Log notes and client conversations effortlessly.</li>
                <li><strong>Follow-up Reminders:</strong> Ensure vital deals and client check-ins are never forgotten.</li>
              </ul>
              <div className="modal-footer-note">
                <p><em>Built as part of a final capstone web application project.</em></p>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={closeModal} style={{ cursor: 'pointer', width: '100%' }}>
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          INTERACTIVE DEMO & CONTACT MODALS
          ========================================================================= */}
      {/* DEMO MODAL */}
      {activeModal === 'demo' && (
        <div className="modal-overlay" style={{ display: 'flex' }} onClick={closeModal}>
          <div className="modal-box modal-box-sm" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              &times;
            </button>
            <div className="modal-header">
              <h2 className="modal-title">
                Request a <span className="text-blue">Live Demo</span>
              </h2>
              <p className="modal-desc">See how TS-CRM can transform your client workflows.</p>
            </div>
            {demoSubmitted ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-success-green)', fontWeight: 600 }}>
                ✓ Demo request received! Our team will contact you shortly.
              </div>
            ) : (
              <form className="modal-form" onSubmit={handleDemoSubmit}>
                <div className="form-group">
                  <label className="form-label">Your Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Alex Morgan"
                    value={demoForm.name}
                    onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Business Phone / Email</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Phone or email"
                    value={demoForm.contact}
                    onChange={(e) => setDemoForm({ ...demoForm, contact: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary btn-full">
                  Request Demo
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 5. CONTACT SALES MODAL */}
      {activeModal === 'contact' && (
        <div className="modal-overlay" style={{ display: 'flex' }} onClick={closeModal}>
          <div className="modal-box modal-box-sm" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              &times;
            </button>
            <div className="modal-header">
              <h2 className="modal-title">
                Contact <span className="text-blue">Sales</span>
              </h2>
              <p className="modal-desc">Have questions? Our capstone support team is ready to help.</p>
            </div>
            {contactSubmitted ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-success-green)', fontWeight: 600 }}>
                ✓ Message sent! We will reply to your email within 24 hours.
              </div>
            ) : (
              <form className="modal-form" onSubmit={handleContactSubmit}>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="you@company.com"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    placeholder="How can we help?"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    required
                  ></textarea>
                </div>
                <button type="submit" className="btn-primary btn-full">
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
