import { useState } from "react";
import { Link } from "react-router-dom";
import "./Register.css";

function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!fullName || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (!agreed) {
      setError("Please agree to the Terms of Service.");
      return;
    }

    setMessage("Account creation submitted.");
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
              />
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
              />
            </div>

            <div className="input-group">
              <label htmlFor="registerPassword">
                Password
              </label>

              <input
                id="registerPassword"
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
              />
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

          <div className="divider">
            <span>OR SIGN UP WITH</span>
          </div>

          <div className="social-buttons">

            <button
              type="button"
              className="social-button"
            >
              <strong>G</strong>
              Google
            </button>

            <button
              type="button"
              className="social-button"
            >
              <strong>
                <img src="download.png" width="20"/>
              </strong>
              Apple
            </button>

          </div>

          <p className="bottom-text">
            Already have an account?{" "}
            <Link to="/login">Sign In</Link>
          </p>

        </div>

      </section>

    </div>
  );
}

export default Register;