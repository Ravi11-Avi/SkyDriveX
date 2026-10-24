import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Cloud, ShieldCheck, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function OAuthSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const refreshToken = searchParams.get("refreshToken");

    if (token) {
      loginWithToken(token, refreshToken)
        .then(() => {
          navigate("/", { replace: true });
        })
        .catch((err) => {
          setError(err.message || "Failed to authenticate session");
          setTimeout(() => navigate("/login", { replace: true }), 3000);
        });
    } else {
      setError("No authentication token provided");
      setTimeout(() => navigate("/login", { replace: true }), 3000);
    }
  }, [searchParams, loginWithToken, navigate]);

  return (
    <div className="auth-page">
      <div className="ambient-glow purple-glow"></div>
      <div className="ambient-glow cyan-glow"></div>

      <div className="auth-card-container">
        <div className="glass-card auth-card text-center" style={{ padding: "3rem 2rem" }}>
          {error ? (
            <>
              <div className="avatar-placeholder error-circle" style={{ margin: "0 auto 1.5rem" }}>
                <AlertCircle size={44} className="text-danger" />
              </div>
              <h2>Authentication Issue</h2>
              <p className="text-secondary" style={{ marginTop: "0.5rem" }}>
                {error}. Redirecting to sign in page...
              </p>
            </>
          ) : (
            <>
              <div className="loading-spinner large" style={{ margin: "0 auto 1.5rem" }}></div>
              <h2>Synchronizing Session</h2>
              <p className="text-secondary" style={{ marginTop: "0.5rem" }}>
                Authenticating with your single sign-on provider. Preparing your cloud workspace...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
