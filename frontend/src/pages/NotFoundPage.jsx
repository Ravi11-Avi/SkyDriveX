import React from "react";
import { Link } from "react-router-dom";
import { Cloud, Compass, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="auth-page">
      <div className="ambient-glow purple-glow"></div>
      <div className="ambient-glow cyan-glow"></div>

      <div className="auth-card-container">
        <div className="glass-card auth-card text-center" style={{ padding: "3.5rem 2rem" }}>
          <div className="notfound-code-glow">404</div>
          <h2>Lost in Cloud Space</h2>
          <p className="text-secondary" style={{ marginTop: "0.75rem", marginBottom: "2rem" }}>
            The file, directory, or page you are looking for does not exist or has been relocated.
          </p>
          <Link to="/" className="btn btn-primary btn-lg inline-flex">
            <ArrowLeft size={18} />
            Return to My Drive
          </Link>
        </div>
      </div>
    </div>
  );
}
