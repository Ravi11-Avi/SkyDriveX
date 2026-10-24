import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Cloud, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
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
    <div className="min-h-screen w-screen flex items-center justify-center p-4 bg-[#06080d] text-slate-100 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-indigo-500/15 via-violet-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md p-8 rounded-3xl bg-[#0c0f17]/90 border border-white/[0.08] shadow-2xl backdrop-blur-2xl flex flex-col items-center text-center gap-4 z-10">
        {error ? (
          <>
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-1">
              <AlertCircle size={28} />
            </div>
            <h2 className="text-lg font-bold font-['Outfit'] text-white">Authentication Issue</h2>
            <p className="text-xs text-zinc-400 max-w-xs">
              {error}. Redirecting to sign in page...
            </p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-1">
              <Loader2 size={28} className="animate-spin" />
            </div>
            <h2 className="text-lg font-bold font-['Outfit'] text-white">Synchronizing Session</h2>
            <p className="text-xs text-zinc-400 max-w-xs">
              Authenticating with your single sign-on provider. Preparing your cloud workspace...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
