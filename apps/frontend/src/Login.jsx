import { useState } from "react";
import "./Login.css";
import './auth.css';
import { api } from './api.js';

function Login({ onLogin, onNavigate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setFieldErrors({});
    setMessage("");

    if (!email || !password) {
      const errors = {};
      if (!email) errors.email = 'Email is required.';
      if (!password) errors.password = 'Password is required.';
      setFieldErrors(errors);
      setError("Please enter your email and password.");
      return;
    }

    setMessage('Signing in...');
    try {
      const data = await api.login({ email, password });
      onLogin(data, keepLoggedIn);
    } catch (err) {
      setMessage('');
      setError(err.message);
      setFieldErrors(err.fields || {});
    }
  }

  return (
    <div className="auth-page">

      {/* LEFT SIDE */}
      <section className="promo-section">

        <div className="brand">
          <div className="brand-icon">♟</div>
          <span>TS-CRM</span>
        </div>

        <div className="promo-content">
          <h1>
            Centralize your
            <br />
            customer
            <br />
            relationships.
          </h1>

          <p>
            The simple, powerful CRM built specifically for growing
            small businesses. Stop losing leads and start closing
            more deals today.
          </p>

          <div className="feature-card">
            <div className="feature-icon">♟</div>

            <div>
              <h3>100% Data Security</h3>
              <p>Bank-grade encryption for all your records</p>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">+</div>

            <div>
              <h3>Smart Interactions</h3>
              <p>Every conversation automatically logged</p>
            </div>
          </div>
        </div>

      </section>

      {/* RIGHT SIDE */}
      <section className="form-section">

        <div className="form-container">

          <div className="form-header">
            <h2>Welcome Back</h2>

            <p>
              Enter your credentials to access your dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="input-group">
              <label htmlFor="email">Email Address</label>

              <input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
              />
              {fieldErrors.email && <p id="login-email-error" className="field-error">{fieldErrors.email}</p>}
            </div>

            <div className="input-group">
              <div className="password-label">
                <label htmlFor="password">Password</label>

                <a href="#" onClick={(event) => event.preventDefault()}>
                  Forgot password?
                </a>
              </div>

              <div className="password-control">
                <input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password}
                  onChange={(event) => setPassword(event.target.value)} aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? 'login-password-error' : undefined} />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                  {showPassword ? <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m3 3 18 18M10.6 10.7a3 3 0 0 0 4.2 4.2M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9.5 4.1 10 8-.2 1.4-1 3-2.3 4.3M6.2 6.2C4.3 7.6 2.6 9.8 2 12c.5 3.9 4.5 8 10 8 1.5 0 2.9-.3 4.1-.8" /></svg> : <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M2 12s3.5-8 10-8 10 8 10 8-3.5 8-10 8S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>}
                </button>
              </div>
              {fieldErrors.password && <p id="login-password-error" className="field-error">{fieldErrors.password}</p>}
            </div>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={keepLoggedIn}
                onChange={(event) =>
                  setKeepLoggedIn(event.target.checked)
                }
              />

              <span>Keep me logged in</span>
            </label>

            {error && <p className="error-message">{error}</p>}

            {message && (
              <p className="success-message">{message}</p>
            )}

            <button type="submit" className="primary-button">
              Login to Workspace
            </button>

          </form>

          <p className="bottom-text">
            New to CRM Core?{" "}
            <a href="/register" onClick={(e) => { e.preventDefault(); onNavigate('/register'); }}>Create an account</a>
          </p>

        </div>

      </section>

    </div>
  );
}

export default Login;
