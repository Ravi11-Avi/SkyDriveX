import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Cloud,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const calculateStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = calculateStrength(password);
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Strong", "Unbreakable"];
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500", "bg-cyan-500"];
  const strengthTextColors = ["text-red-400", "text-orange-400", "text-amber-400", "text-emerald-400", "text-cyan-400"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await register(name, email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#06080d] text-slate-900 dark:text-slate-100 relative overflow-hidden font-sans transition-colors duration-200">
      {/* Background Ambient Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-indigo-500/15 via-violet-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md flex flex-col gap-6 z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 mb-1">
            <Cloud size={28} className="stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-bold font-['Outfit'] tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
            SkyDrive<span className="text-indigo-600 dark:text-indigo-400">X</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs">
            Receive 5 GB free zero-knowledge cloud storage upon account creation
          </p>
        </div>

        {/* Card */}
        <div className="p-8 rounded-3xl bg-white dark:bg-[#0c0f17]/90 border border-slate-200 dark:border-white/[0.08] shadow-2xl backdrop-blur-2xl flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold font-['Outfit'] text-slate-900 dark:text-white">Create Account</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Start organizing, previewing, and transferring files</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-xs">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700 dark:text-zinc-300">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Mercer"
                  className="w-full bg-slate-50 dark:bg-[#0d101a] border border-slate-200 dark:border-white/[0.08] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 pl-9 pr-3 py-2.5 rounded-xl outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700 dark:text-zinc-300">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full bg-slate-50 dark:bg-[#0d101a] border border-slate-200 dark:border-white/[0.08] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 pl-9 pr-3 py-2.5 rounded-xl outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700 dark:text-zinc-300">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full bg-slate-50 dark:bg-[#0d101a] border border-slate-200 dark:border-white/[0.08] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 pl-9 pr-9 py-2.5 rounded-xl outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Password strength bar */}
              {password && (
                <div className="flex items-center justify-between gap-3 mt-1.5 px-0.5">
                  <div className="flex items-center gap-1 flex-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          strength >= level ? strengthColors[strength] : "bg-slate-200 dark:bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-[10px] font-bold tracking-wider uppercase ${strengthTextColors[strength]}`}>
                    {strengthLabels[strength]}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700 dark:text-zinc-300">Confirm Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full bg-slate-50 dark:bg-[#0d101a] border border-slate-200 dark:border-white/[0.08] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 pl-9 pr-3 py-2.5 rounded-xl outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Provisioning Drive...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Separator */}
          <div className="flex items-center my-1">
            <div className="flex-1 border-t border-slate-200 dark:border-white/[0.06]" />
            <span className="px-3 text-[11px] text-slate-400 dark:text-zinc-500 uppercase font-semibold tracking-wider">
              or sign up with
            </span>
            <div className="flex-1 border-t border-slate-200 dark:border-white/[0.06]" />
          </div>

          {/* Social OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <a
              href="/api/v1/auth/google"
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-zinc-200 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>Google</span>
            </a>

            <a
              href="/api/v1/auth/github"
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-zinc-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span>GitHub</span>
            </a>
          </div>

          <div className="text-center text-xs text-slate-500 dark:text-zinc-400 mt-1">
            <span>Already have an account? </span>
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>

        {/* Security Tag */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-zinc-500">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Compliant Zero-Knowledge Storage Architecture</span>
        </div>
      </div>
    </div>
  );
}
