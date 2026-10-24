import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Cloud,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { authApi } from "../services/api";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await authApi.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="ambient-glow purple-glow"></div>
      <div className="ambient-glow cyan-glow"></div>

      <div className="auth-card-container">
        <div className="auth-brand-wrap">
          <Link to="/" className="brand-logo large">
            <Cloud className="brand-icon" size={36} />
            <span className="brand-name">
              SkyDrive<span className="brand-x">X</span>
            </span>
          </Link>
        </div>

        <div className="glass-card auth-card">
          {success ? (
            <div className="text-center py-4">
              <div className="avatar-placeholder success-circle" style={{ margin: "0 auto 1.5rem" }}>
                <CheckCircle size={44} className="text-success" />
              </div>
              <h2>Password Reset Successful</h2>
              <p className="text-secondary" style={{ marginTop: "0.5rem", marginBottom: "1.5rem" }}>
                Your account password has been updated securely. You can now log in using your new credentials.
              </p>
              <button
                className="btn btn-primary btn-block btn-lg"
                onClick={() => navigate("/login")}
              >
                Proceed to Sign In
              </button>
            </div>
          ) : (
            <>
              <div className="auth-header">
                <h2>Set New Password</h2>
                <p>Enter and confirm your new secure password</p>
              </div>

              {error && (
                <div className="auth-error-banner">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <div className="input-group">
                    <Lock size={18} className="input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-input has-icon has-action"
                      placeholder="Minimum 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoFocus
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

                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <div className="input-group">
                    <Lock size={18} className="input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-input has-icon"
                      placeholder="Repeat your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
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
                      Updating...
                    </>
                  ) : (
                    <>
                      Save New Password
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
