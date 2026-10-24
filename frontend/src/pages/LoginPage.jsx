import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Cloud,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/api";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Forgot password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotError, setForgotError] = useState("");

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      setError("");
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;

    try {
      setForgotLoading(true);
      setForgotError("");
      const res = await authApi.forgotPassword(forgotEmail);
      setForgotSuccess(
        res.message || "Password reset instructions have been sent to your email."
      );
    } catch (err) {
      setForgotError(err.message || "Failed to request password reset");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Dynamic ambient background glow */}
      <div className="ambient-glow purple-glow"></div>
      <div className="ambient-glow cyan-glow"></div>

      <div className="auth-card-container">
        {/* Brand header */}
        <div className="auth-brand-wrap">
          <Link to="/" className="brand-logo large">
            <Cloud className="brand-icon" size={36} />
            <span className="brand-name">
              SkyDrive<span className="brand-x">X</span>
            </span>
          </Link>
          <p className="auth-subtitle">
            Next-Generation Cloud Storage & Collaborative Workspace
          </p>
        </div>

        {/* Card */}
        <div className="glass-card auth-card">
          <div className="auth-header">
            <h2>Welcome Back</h2>
            <p>Enter your credentials to access your secure drive</p>
          </div>

          {error && (
            <div className="auth-error-banner">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-group">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  className="form-input has-icon"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label">Password</label>
                <button
                  type="button"
                  className="btn-link-subtle"
                  onClick={() => {
                    setForgotEmail(email);
                    setShowForgotModal(true);
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="input-group">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-input has-icon has-action"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="input-action-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner mini"></div>
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Social Sign-in Separator */}
          <div className="auth-separator">
            <span>or continue with</span>
          </div>

          <div className="oauth-buttons-grid">
            <a
              href="/api/v1/auth/google"
              className="btn btn-secondary oauth-btn"
            >
              <svg className="oauth-icon" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.8.7 5.5 1.9 7.9l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
                />
              </svg>
              Google
            </a>

            <a
              href="/api/v1/auth/github"
              className="btn btn-secondary oauth-btn"
            >
              <svg className="oauth-icon" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              GitHub
            </a>
          </div>

          <div className="auth-footer-prompt">
            <span>Don't have an account? </span>
            <Link to="/register" className="auth-accent-link">
              Create an account
            </Link>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="auth-security-note">
          <ShieldCheck size={16} />
          <span>AES-256 Cloud Storage Encryption Active</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-backdrop">
          <div className="glass-card modal-container small">
            <div className="modal-header">
              <h3>Reset Your Password</h3>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotSuccess("");
                  setForgotError("");
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {forgotSuccess ? (
                <div className="feedback-alert success">
                  <CheckCircle size={20} />
                  <span>{forgotSuccess}</span>
                </div>
              ) : (
                <>
                  <p className="modal-desc">
                    Enter the email address registered with your SkyDriveX account and we'll send you a password reset link.
                  </p>

                  {forgotError && (
                    <div className="auth-error-banner" style={{ marginBottom: "1rem" }}>
                      <AlertCircle size={16} />
                      <span>{forgotError}</span>
                    </div>
                  )}

                  <form onSubmit={handleForgotPassword}>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="name@company.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="modal-footer" style={{ padding: 0, marginTop: "1.5rem" }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowForgotModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={forgotLoading || !forgotEmail}
                      >
                        {forgotLoading ? "Sending..." : "Send Reset Link"}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
