import { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [lastVolume, setLastVolume] = useState(0.4);
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ type: null, message: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = true;
    vid.play().catch(() => {});
  }, []);

  function applyVolume(val) {
    const v = Math.round(val * 100) / 100;
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v;
    if (audioRef.current) audioRef.current.volume = v;
  }

  function handleVolumeSlider(e) {
    const v = parseFloat(e.target.value);
    applyVolume(v);
    if (v === 0) {
      setMuted(true);
    } else {
      setMuted(false);
      setLastVolume(v);
    }
  }

  function toggleMute() {
    if (muted) {
      const restore = lastVolume > 0 ? lastVolume : 0.4;
      applyVolume(restore);
      setMuted(false);
    } else {
      setLastVolume(volume);
      applyVolume(0);
      setMuted(true);
    }
  }

  function switchMode(next) {
    if (next === mode) return;
    setStatus({ type: null, message: "" });
    setMode(next);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: "" });
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setStatus({ type: "error", message: error.message });
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setStatus({ type: "error", message: error.message });
      else setStatus({ type: "success", message: "Check your inbox to confirm your email." });
    }
    setLoading(false);
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  }

  const volPct = muted ? 0 : Math.round(volume * 100);
  const trackFill = `linear-gradient(to right, #FFD23F ${volPct}%, rgba(255,255,255,0.15) ${volPct}%)`;

  return (
    <div className="min-h-screen bg-[#0e0b14] flex items-center justify-center p-4 sm:p-6">
      <style>{`
        @keyframes cardLand {
          0%   { opacity: 0; transform: translateY(12px) scale(.97); }
          100% { opacity: 1; transform: translateY(0)    scale(1);   }
        }
        .card-land { animation: cardLand .4s cubic-bezier(.34,1.56,.64,1) both; }

        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: #fff;
          -webkit-box-shadow: 0 0 0 1000px rgba(255,255,255,.04) inset;
          transition: background-color 5000s ease-in-out 0s;
        }

        @media (prefers-reduced-motion: reduce) {
          .card-land { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>

      {/* Outer card — stacks vertically on mobile, side-by-side on md+ */}
      <div className="w-full max-w-sm md:max-w-6xl flex flex-col md:flex-row rounded-[20px] overflow-hidden border border-white/8">

        {/* ── Left / Top: video hero ── */}
        <div className="relative flex flex-col justify-end overflow-hidden bg-[#1a1426] min-h-55 md:min-h-140 md:flex-1 p-6 md:p-10">

          {/* Orbs */}
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)", transform: "translate(80px,-80px)" }} />
          <div className="absolute bottom-0 left-0 w-52 h-52 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(255,92,138,0.12) 0%, transparent 70%)", transform: "translate(-60px,60px)" }} />

          {/* Background video */}
          <video
            ref={videoRef}
            autoPlay
            loop
            playsInline
            muted
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          >
            <source src="https://yjkvfbuyjlxnaeuivgxs.supabase.co/storage/v1/object/public/videos/dances/sample-dance.mp4" type="video/mp4" />
          </video>

          {/* Gradient overlay — fades up on mobile, fades right on desktop */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(to top, rgba(14,11,20,0.95) 0%, rgba(14,11,20,0.35) 55%, transparent 100%)",
            }}
          />
          <div className="absolute inset-0 pointer-events-none hidden md:block"
            style={{
              background: "linear-gradient(to right, rgba(14,11,20,0.85) 0%, rgba(14,11,20,0.3) 60%, transparent 100%)",
            }}
          />

          {/* Volume control */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
              className="w-8 h-8 rounded-full border border-white/12 bg-white/6 text-white/60 text-sm flex items-center justify-center cursor-pointer hover:bg-white/12 hover:text-white transition-all shrink-0"
            >
              {muted || volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
            </button>
            <div className="flex items-center px-2.5 h-8 w-22 bg-white/5 border border-white/10 rounded-full">
              <input
                type="range"
                className="vol-slider"
                min="0"
                max="1"
                step="0.01"
                value={muted ? 0 : volume}
                onChange={handleVolumeSlider}
                aria-label="Volume"
                style={{ background: trackFill }}
              />
            </div>
            <span className="text-[11px] text-white/35 min-w-7.5 text-right tabular-nums">
              {volPct}%
            </span>
          </div>

          {/* Hero text — compact on mobile, full on desktop */}
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-2 md:mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD23F]" />
              <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#FFD23F]">Dance Coach</span>
            </div>

            <h1 className="font-blackops font-semibold text-white leading-[1.15] tracking-tight text-[26px] md:text-[36px] mb-0 md:mb-3">
              Move better,{" "}
              <span className="md:hidden text-[#FF5C8A]">every rep.</span>
              <span className="hidden md:block text-[#FF5C8A]">every rep.</span>
            </h1>

            {/* Subtext + features — desktop only */}
            <div className="hidden md:block">
              <p className="font-changatext-[16px] text-white/40 leading-relaxed max-w-full mt-3 mb-6">
                Real-time pose tracking and AI scoring so you can master any routine at your own pace.
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { icon: "◎", text: "Live skeleton overlay & match scoring" },
                  { icon: "▶", text: "Step-by-step breakdown of any dance" },
                  { icon: "↑",  text: "Track your progress over time" },
                ].map((f) => (
                  <div key={f.text} className="flex items-center gap-2.5 px-3 py-2.5 bg-white/3 border border-white/[0.07] rounded-[10px]">
                    <div className="w-7 h-7 rounded-lg bg-[#FFD23F]/8 border border-[#FFD23F]/15 flex items-center justify-center text-[13px] text-[#FFD23F] shrink-0">
                      {f.icon}
                    </div>
                    <span className="text-[12px] text-white/60">{f.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right / Bottom: form ── */}
        <div className="bg-[#0b0910] flex flex-col justify-center border-t border-white/6 md:border-t-0 md:border-l md:border-white/6 p-6 sm:p-8 md:p-10 w-full md:w-95 shrink-0">
          <div className="card-land w-full max-w-sm mx-auto md:max-w-none">

            {/* Header */}
            <div className="mb-7 text-center">
              <p className="font-blackops text-[10px] font-bold tracking-[0.14em] uppercase text-[#FFD23F] mb-2">Dance Coach</p>
              <h2 className="font-blackops text-[22px] font-bold text-white mb-1 tracking-tight">
                {mode === "login" ? "Welcome back" : "Create account"}
              </h2>
              <p className="font-blackops text-[13px] text-white/35">
                {mode === "login" ? "Sign in to continue your practice" : "Start your dance journey today"}
              </p>
            </div>

            {/* Tab switcher */}
            <div className="flex bg-white/4 border border-white/8 rounded-[10px] p-0.75 mb-6">
              {["login", "signup"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={`flex-1 py-2 rounded-lg text-[13px] font-semibold cursor-pointer transition-all ${
                    mode === m ? "bg-[#FFD23F] text-[#0e0b14]" : "bg-transparent text-white/35"
                  }`}
                >
                  {m === "login" ? "Log in" : "Sign up"}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div>
                <p className="text-[10px] font-semibold tracking-widest uppercase text-white/35 mb-1.5">Email</p>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full bg-white/4 border border-white/8 rounded-[9px] px-3.5 py-2.75 text-sm text-white outline-none focus:border-[#FFD23F]/40 focus:ring-2 focus:ring-[#FFD23F]/8 placeholder:text-white/18 transition-all"
                />
              </div>

              <div>
                <p className="text-[10px] font-semibold tracking-widest uppercase text-white/35 mb-1.5">Password</p>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="w-full bg-white/4 border border-white/8 rounded-[9px] px-3.5 py-2.75 text-sm text-white outline-none focus:border-[#FFD23F]/40 focus:ring-2 focus:ring-[#FFD23F]/8 placeholder:text-white/18 transition-all"
                />
              </div>

              {mode === "login" && (
                <div className="text-right -mt-1">
                  <span className="text-xs text-[#FFD23F] cursor-pointer hover:opacity-80 transition-opacity">
                    Forgot password?
                  </span>
                </div>
              )}

              {status.type && (
                <p className={`text-xs ${status.type === "error" ? "text-red-400" : "text-emerald-400"}`}>
                  {status.message}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer w-full py-3 rounded-[9px] bg-[#FFD23F] text-[#0e0b14] text-sm font-bold disabled:opacity-50 tracking-wide hover:opacity-90 active:scale-[0.98] transition-all"
              >
                {loading ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-2.5 my-4">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-[11px] text-white/25">or continue with</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>

            {/* Google */}
            <button
              onClick={handleGoogle}
              type="button"
              className="w-full cursor-pointer py-2.75 rounded-[9px] bg-white/4 border border-white/8 text-white/60 text-[13px] flex items-center justify-center gap-2 mb-5 hover:bg-white/8 transition-all"
            >
              <svg width="15" height="15" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Switch mode */}
            <p className="text-center text-[13px] text-white/35">
              {mode === "login" ? (
                <>Don't have an account?{" "}
                  <span className="text-[#FFD23F] cursor-pointer hover:opacity-80 transition-opacity" onClick={() => switchMode("signup")}>Sign up</span>
                </>
              ) : (
                <>Already have an account?{" "}
                  <span className="text-[#FFD23F] cursor-pointer hover:opacity-80 transition-opacity" onClick={() => switchMode("login")}>Log in</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}