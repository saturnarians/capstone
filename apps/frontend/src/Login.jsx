import { useState } from "react";
import { Link } from "react-router-dom";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setMessage("Login submitted.");
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
              />
            </div>

            <div className="input-group">
              <div className="password-label">
                <label htmlFor="password">Password</label>

                <a href="#" onClick={(event) => event.preventDefault()}>
                  Forgot password?
                </a>
              </div>

              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
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

          <div className="divider">
            <span>OR CONTINUE WITH</span>
          </div>

          <div className="social-buttons">

            <button type="button" className="social-button">
              <strong>G</strong>
              Google
            </button>

            <button type="button" className="social-button">
              <strong>
                <img src="download.png"/>
              </strong>
              Apple
            </button>

          </div>

          <p className="bottom-text">
            New to CRM Core?{" "}
            <Link to="/register">Create an account</Link>
          </p>

        </div>

      </section>

    </div>
  );
}

export default Login;