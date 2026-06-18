import { useRef, useState, useEffect } from "react";

const SPEEDS = [0.25, 0.5, 0.75, 1];

export default function DancePlayer({ videoUrl, steps = [] }) {
  const videoRef = useRef(null);
  const [speed, setSpeed] = useState(1);
  const [mirrored, setMirrored] = useState(false);
  const [loopStep, setLoopStep] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);

  function seekToStep(index) {
    const step = steps[index];
    if (videoRef.current && step) {
      videoRef.current.currentTime = step.startTime;
      videoRef.current.play();
    }
  }

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    if (loopStep !== null) {
      const step = steps[loopStep];
      if (step && video.currentTime >= step.endTime) {
        video.currentTime = step.startTime;
      }
    }
  }

  const activeStepIndex = steps.findIndex(
    (s) => currentTime >= s.startTime && currentTime < s.endTime
  );

  return (
    <div className="flex flex-col md:flex-row gap-3 w-full h-full overflow-auto md:overflow-hidden">

      {/* Video */}
      <div className="relative bg-black rounded-2xl overflow-hidden shrink-0 md:flex-1 md:min-h-0 md:shrink"
        style={{ minHeight: 220 }}>
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-white/40">
            Reference
          </span>
        </div>
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          onTimeUpdate={handleTimeUpdate}
          className={`w-full h-full object-contain ${mirrored ? "transform-[scaleX(-1)]" : ""}`}
          style={{ minHeight: 220 }}
        />
      </div>

      {/* Sidebar */}
      <div className="flex flex-col gap-3 shrink-0 md:w-60">

        {/* Playback controls */}
        <div className="bg-[#0f0f14] border border-[#1a1a24] rounded-[14px] p-4">
          <p className="text-[9px] font-bold tracking-[0.12em] uppercase text-zinc-600 mb-3">
            Playback
          </p>
          <div className="flex gap-1.5">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`flex-1 py-2 rounded-lg text-[11px] font-semibold border-none cursor-pointer transition-all ${
                  speed === s
                    ? "bg-cyan-400 text-[#083344]"
                    : "bg-[#1a1a24] text-zinc-600 hover:text-zinc-400"
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
          <button
            onClick={() => setMirrored((m) => !m)}
            className={`w-full mt-2 py-2.5 rounded-[9px] text-xs font-medium border-none cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
              mirrored
                ? "bg-cyan-400 text-[#083344]"
                : "bg-[#1a1a24] text-zinc-500 hover:text-zinc-300"
            }`}
          >
            ⇄ Mirror
          </button>
        </div>

        {/* Steps */}
        <div className="bg-[#0f0f14] border border-[#1a1a24] rounded-[14px] p-4 flex flex-col md:flex-1 md:min-h-0">
          <p className="text-[9px] font-bold tracking-[0.12em] uppercase text-zinc-600 mb-3 shrink-0">
            Steps
          </p>
          <ul className="flex flex-col gap-0 overflow-auto">
            {steps.map((step, i) => (
              <li key={i}>
                <div
                  onClick={() => seekToStep(i)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] cursor-pointer border transition-all ${
                    i === activeStepIndex
                      ? "bg-[#071e26] border-[#0e4f63]"
                      : "bg-[#0a0a10] border-transparent hover:bg-[#111118]"
                  }`}
                >
                  <span className={`text-[10px] font-bold w-4 text-center shrink-0 ${
                    i === activeStepIndex ? "text-cyan-400" : "text-zinc-700"
                  }`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={`flex-1 text-xs truncate ${
                    i === activeStepIndex ? "text-[#e0f7fa]" : "text-zinc-500"
                  }`}>
                    {step.label ?? `Step ${i + 1}`}
                  </span>
                  <span className={`text-[10px] shrink-0 ${
                    i === activeStepIndex ? "text-[#0891b2]" : "text-zinc-700"
                  }`}>
                    {step.startTime}–{step.endTime}s
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLoopStep(loopStep === i ? null : i);
                    }}
                    className={`w-5.5 h-5.5 rounded-md flex items-center justify-center text-[11px] border cursor-pointer shrink-0 transition-all ${
                      loopStep === i
                        ? "bg-[#0e4f63] border-[#0891b2] text-cyan-400"
                        : "bg-[#111118] border-[#1a1a24] text-zinc-600 hover:text-zinc-400"
                    }`}
                  >
                    ↺
                  </button>
                </div>
                {i < steps.length - 1 && (
                  <div className="h-px bg-[#111118] mx-1" />
                )}
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}