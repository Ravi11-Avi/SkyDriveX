import React from "react";
import { Link } from "react-router-dom";
import { Cloud, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 bg-[#06080d] text-slate-100 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-indigo-500/15 via-violet-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md p-8 rounded-3xl bg-[#0c0f17]/90 border border-white/[0.08] shadow-2xl backdrop-blur-2xl flex flex-col items-center text-center gap-4 z-10">
        <span className="text-6xl font-extrabold font-['Outfit'] bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          404
        </span>
        <h2 className="text-xl font-bold font-['Outfit'] text-white">Lost in Cloud Space</h2>
        <p className="text-xs text-zinc-400 max-w-xs mb-2">
          The file, directory, or page you are looking for does not exist or has been relocated.
        </p>
        <Link
          to="/"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
        >
          <ArrowLeft size={15} />
          <span>Return to My Drive</span>
        </Link>
      </div>
    </div>
  );
}
