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
    <div className="flex flex-col md:flex-row gap-3 w-full md:h-full overflow-hidden">

      <div className="flex items-center justify-center min-w-0 md:flex-1 md:min-h-0">
        <div className="relative w-full max-w-105 md:max-w-none md:w-auto md:h-full aspect-3/4 bg-black rounded-2xl overflow-hidden">
          <span className="absolute top-3 left-3 z-10 text-[11px] tracking-wider uppercase text-white/30 pointer-events-none">
            Reference
          </span>
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            onTimeUpdate={handleTimeUpdate}
            className={`w-full h-full object-cover ${mirrored ? "transform-[scaleX(-1)]" : ""}`}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full md:w-55 md:shrink-0 overflow-hidden">

        <div className="bg-[#111113] rounded-xl border border-[#1f1f23] p-4 shrink-0">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600 mb-3">Playback</p>
          <div className="flex gap-1">
            {SPEEDS.map((s) => (
              <button key={s} onClick={() => setSpeed(s)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${speed === s ? "bg-cyan-400 text-[#083344]" : "bg-zinc-800 text-zinc-500"}`}>
                {s}×
              </button>
            ))}
          </div>
          <button onClick={() => setMirrored((m) => !m)}
            className={`w-full mt-2 py-2 rounded-lg text-sm ${mirrored ? "bg-cyan-400 text-[#083344]" : "bg-zinc-800 text-zinc-400"}`}>
            ⇄ Mirror
          </button>
        </div>

        <div className="bg-[#111113] rounded-xl border border-[#1f1f23] p-4 flex-1 min-h-0 max-h-64 md:max-h-none overflow-auto">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600 mb-3">Steps</p>
          <ul className="flex flex-col gap-1.5">
            {steps.map((step, i) => (
              <li key={i}>
                <div onClick={() => seekToStep(i)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer border ${i === activeStepIndex ? "bg-cyan-950 border-cyan-800" : "bg-zinc-900 border-transparent"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${i === activeStepIndex ? "bg-cyan-400" : "bg-zinc-600"}`} />
                  <span className={`flex-1 text-sm truncate ${i === activeStepIndex ? "text-cyan-100" : "text-zinc-400"}`}>
                    {step.label ?? `Step ${i + 1}`}
                  </span>
                  <span className={`text-[11px] shrink-0 ${i === activeStepIndex ? "text-cyan-600" : "text-zinc-600"}`}>
                    {step.startTime}–{step.endTime}s
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); setLoopStep(loopStep === i ? null : i); }}
                    className={`text-sm shrink-0 ${loopStep === i ? "text-cyan-400" : "text-zinc-600"}`}>
                    ↺
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}