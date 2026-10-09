import { useState } from "react";
import "./Register.css";
import './auth.css';
import { api } from './api.js';

function Register({ onRegister, onNavigate }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setFieldErrors({});
    setMessage("");

    if (!fullName || !email || !password) {
      const errors = {};
      if (!fullName) errors.name = 'Name is required.';
      if (!email) errors.email = 'Email is required.';
      if (!password) errors.password = 'Password is required.';
      setFieldErrors(errors);
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 8 || new TextEncoder().encode(password).length > 72) {
      setFieldErrors({ password: 'Password must be at least 8 characters and at most 72 UTF-8 bytes.' });
      return;
    }

    if (!agreed) {
      setError("Please agree to the Terms of Service.");
      return;
    }

    setMessage('Creating your account...');
    try {
      const data = await api.register({ name: fullName, email, password });
      onRegister(data, true);
    } catch (err) {
      setMessage('');
      setError(err.message);
      setFieldErrors(err.fields || {});
    }
  }

  return (
    <div className="register-page">

      {/* LEFT SIDE */}
      <section className="register-promo">

        <div className="brand">
          <div className="brand-icon">♟</div>
          <span>TS-CRM</span>
        </div>

        <div className="register-promo-content">

          <h1>
            Start growing
            <br />
            your business
            <br />
            today.
          </h1>

          <p>
            Join thousands of small businesses that trust TS-CRM
            to organize their customer relationships and close
            more deals.
          </p>

          <div className="feature-card">
            <div className="feature-icon">✓</div>

            <div>
              <h3>Quick Setup</h3>
              <p>Get up and running in less than 5 minutes</p>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">+</div>

            <div>
              <h3>Unlimited Contacts</h3>
              <p>Scale your database without extra costs</p>
            </div>
          </div>

        </div>
      </section>

      {/* RIGHT SIDE */}
      <section className="register-form-section">

        <div className="register-form-container">

          <div className="form-header">
            <h2>Create your account</h2>

            <p>
              Join CRM Core and manage your customers
            </p>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="input-group">
              <label htmlFor="fullName">
                Full Name
              </label>

              <input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(event) =>
                  setFullName(event.target.value)
                }
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? 'register-name-error' : undefined}
              />
              {fieldErrors.name && <p id="register-name-error" className="field-error">{fieldErrors.name}</p>}
            </div>

            <div className="input-group">
              <label htmlFor="registerEmail">
                Email Address
              </label>

              <input
                id="registerEmail"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
              />
              {fieldErrors.email && <p id="register-email-error" className="field-error">{fieldErrors.email}</p>}
            </div>

            <div className="input-group">
              <label htmlFor="registerPassword">
                Password
              </label>

              <div className="password-control">
                <input id="registerPassword" type={showPassword ? 'text' : 'password'} placeholder="Create a strong password" value={password}
                  onChange={(event) => setPassword(event.target.value)} aria-invalid={Boolean(fieldErrors.password)} aria-describedby="register-password-help register-password-error" />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>{showPassword ? <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m3 3 18 18M10.6 10.7a3 3 0 0 0 4.2 4.2M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9.5 4.1 10 8-.2 1.4-1 3-2.3 4.3M6.2 6.2C4.3 7.6 2.6 9.8 2 12c.5 3.9 4.5 8 10 8 1.5 0 2.9-.3 4.1-.8" /></svg> : <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M2 12s3.5-8 10-8 10 8 10 8-3.5 8-10 8S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>}</button>
              </div>
              <p id="register-password-help" className="password-help">Minimum 8 characters</p>
              {fieldErrors.password && <p id="register-password-error" className="field-error">{fieldErrors.password}</p>}
            </div>

            <label className="terms-label">

              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) =>
                  setAgreed(event.target.checked)
                }
              />

              <span>
                I agree to the{" "}
                <a
                  href="#"
                  onClick={(event) =>
                    event.preventDefault()
                  }
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  onClick={(event) =>
                    event.preventDefault()
                  }
                >
                  Privacy Policy
                </a>
              </span>

            </label>

            {error && (
              <p className="error-message">
                {error}
              </p>
            )}

            {message && (
              <p className="success-message">
                {message}
              </p>
            )}

            <button
              type="submit"
              className="primary-button"
            >
              Create Account
            </button>

          </form>

          <p className="bottom-text">
            Already have an account?{" "}
            <a href="/login" onClick={(e) => { e.preventDefault(); onNavigate('/login'); }}>Sign In</a>
          </p>

        </div>

      </section>

    </div>
  );
}

export default Register;
