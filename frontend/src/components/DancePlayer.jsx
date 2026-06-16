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
    <div style={{ display: "flex", gap: "12px", height: "100%", width: "100%", overflow: "hidden" }}>

      {/* Video */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minWidth: 0, minHeight: 0 }}>
        <div style={{ position: "relative", height: "100%", aspectRatio: "3/4", background: "#000", borderRadius: "16px", overflow: "hidden" }}>
          <span style={{ position: "absolute", top: 12, left: 12, zIndex: 10, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }}>
            Reference
          </span>
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            onTimeUpdate={handleTimeUpdate}
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: mirrored ? "scaleX(-1)" : "none" }}
          />
        </div>
      </div>

      {/* Sidebar */}
      <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12, overflow: "hidden" }}>

        {/* Playback */}
        <div style={{ background: "#111113", borderRadius: 12, border: "1px solid #1f1f23", padding: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#52525b", marginBottom: 12 }}>
            Playback
          </p>
          <div style={{ display: "flex", gap: 4 }}>
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                style={{
                  flex: 1, padding: "6px 0", borderRadius: 8, fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer",
                  background: speed === s ? "#22d3ee" : "#27272a",
                  color: speed === s ? "#083344" : "#71717a",
                }}
              >
                {s}×
              </button>
            ))}
          </div>
          <button
            onClick={() => setMirrored((m) => !m)}
            style={{
              width: "100%", marginTop: 8, padding: "8px 0", borderRadius: 8, fontSize: 13, border: "none", cursor: "pointer",
              background: mirrored ? "#22d3ee" : "#27272a",
              color: mirrored ? "#083344" : "#a1a1aa",
            }}
          >
            ⇄ Mirror
          </button>
        </div>

        {/* Steps */}
        <div style={{ background: "#111113", borderRadius: 12, border: "1px solid #1f1f23", padding: 16, flex: 1, overflow: "auto" }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#52525b", marginBottom: 12 }}>
            Steps
          </p>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {steps.map((step, i) => (
              <li key={i}>
                <div
                  onClick={() => seekToStep(i)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 9, cursor: "pointer",
                    background: i === activeStepIndex ? "#083344" : "#1c1c1f",
                    border: i === activeStepIndex ? "1px solid #164e63" : "1px solid transparent",
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: i === activeStepIndex ? "#22d3ee" : "#3f3f46" }} />
                  <span style={{ flex: 1, fontSize: 13, color: i === activeStepIndex ? "#e0f7fa" : "#a1a1aa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {step.label ?? `Step ${i + 1}`}
                  </span>
                  <span style={{ fontSize: 11, flexShrink: 0, color: i === activeStepIndex ? "#0891b2" : "#3f3f46" }}>
                    {step.startTime}–{step.endTime}s
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setLoopStep(loopStep === i ? null : i); }}
                    style={{ fontSize: 13, background: "none", border: "none", cursor: "pointer", flexShrink: 0, color: loopStep === i ? "#22d3ee" : "#3f3f46" }}
                  >
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