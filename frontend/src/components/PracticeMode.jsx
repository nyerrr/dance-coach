import { useRef, useEffect, useState } from "react";
import { usePoseLandmarker } from "../hooks/usePoseLandmarker";
import { PoseLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import { saveProgress } from "../lib/progress";

function normalize(landmarks) {
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const cx = (leftHip.x + rightHip.x) / 2;
  const cy = (leftHip.y + rightHip.y) / 2;
  const torsoLength = Math.hypot(
    ((leftShoulder.x + rightShoulder.x) / 2) - cx,
    ((leftShoulder.y + rightShoulder.y) / 2) - cy
  );
  const scale = torsoLength > 0 ? 1 / torsoLength : 1;
  return landmarks.map(({ x, y, z, visibility }) => ({
    x: (x - cx) * scale, y: (y - cy) * scale, z: z * scale, visibility,
  }));
}

function computeScore(userLandmarks, refLandmarks) {
  if (!userLandmarks || !refLandmarks) return null;
  const user = normalize(userLandmarks);
  const ref = normalize(refLandmarks);
  let total = 0;
  for (let i = 0; i < Math.min(user.length, ref.length); i++) {
    const dist = Math.hypot(user[i].x - ref[i].x, user[i].y - ref[i].y);
    total += Math.max(0, 1 - dist / 1.0);
  }
  return Math.round((total / user.length) * 100);
}

function findRefLandmarks(keyframes, currentTime) {
  if (!keyframes.length) return null;
  let closest = keyframes[0];
  let minDiff = Math.abs(keyframes[0].t - currentTime);
  for (const frame of keyframes) {
    const diff = Math.abs(frame.t - currentTime);
    if (diff < minDiff) { minDiff = diff; closest = frame; }
  }
  return closest.landmarks;
}

function scoreColor(s) {
  if (s === null || s === undefined) return "#2a2a3a";
  if (s >= 80) return "#4ade80";
  if (s >= 50) return "#facc15";
  return "#f87171";
}

export default function PracticeMode({ videoUrl, keyframes = [], steps = [], danceId }) {
  const videoRef = useRef(null);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const { landmarks, status } = usePoseLandmarker(webcamRef);
  const bestScoreRef = useRef(0);

  const [score, setScore] = useState(null);
  const [stepScores, setStepScores] = useState({});
  const [currentTime, setCurrentTime] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (webcamRef.current) webcamRef.current.srcObject = stream;
    });
  }, []);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 640, 480);
    if (landmarks) {
      const drawingUtils = new DrawingUtils(ctx);
      drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
        color: "rgba(34,211,238,0.6)", lineWidth: 2,
      });
      drawingUtils.drawLandmarks(landmarks, {
        color: "#22d3ee", fillColor: "rgba(34,211,238,0.2)", radius: 3,
      });
    }
  }, [landmarks]);

  useEffect(() => {
    if (!landmarks || !keyframes.length) return;
    const refLandmarks = findRefLandmarks(keyframes, currentTime);
    const s = computeScore(landmarks, refLandmarks);
    setScore(s);
    if (s !== null && s > bestScoreRef.current) {
      bestScoreRef.current = s;
      forceUpdate((n) => n + 1);
    }
    const activeStep = steps.findIndex(
      (step) => currentTime >= step.startTime && currentTime < step.endTime
    );
    if (activeStep !== -1 && s !== null) {
      setStepScores((prev) => ({
        ...prev,
        [activeStep]: Math.round(((prev[activeStep] ?? s) + s) / 2),
      }));
    }
  }, [landmarks, currentTime, keyframes, steps]);

  const activeStepIndex = steps.findIndex(
    (s) => currentTime >= s.startTime && currentTime < s.endTime
  );

  return (
    <div className="flex flex-col gap-3 w-full h-full overflow-auto md:overflow-hidden">

      {/* Score bar */}
      <div className="flex gap-2 shrink-0 h-16">
        <div className="flex-1 bg-[#0f0f14] border border-[#1a1a24] rounded-xl px-3 py-2 flex items-center gap-3">
          <p className="text-2xl font-bold leading-none" style={{ color: scoreColor(score) }}>
            {score !== null ? score : "—"}
          </p>
          <div>
            <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-600">Match score</p>
            <p className="text-[10px] text-zinc-600 mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
              Live
            </p>
          </div>
        </div>
        <div className="flex-1 bg-[#0f0f14] border border-[#1a1a24] rounded-xl px-4 py-3 flex items-center gap-3">
          <p className="text-3xl font-bold leading-none" style={{ color: scoreColor(bestScoreRef.current || null) }}>
            {bestScoreRef.current > 0 ? bestScoreRef.current : "—"}
          </p>
          <div>
            <p className="text-[9px] font-bold tracking-widest uppercase text-zinc-600">Best</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">This session</p>
          </div>
        </div>
      </div>

      {/* Videos */}
      <div className="flex gap-2 shrink-0 h-80 md:flex-1 md:h-auto md:min-h-0">

        {/* Reference */}
        <div className="flex-1 relative bg-[#0a0a12] border border-[#1a1a24] rounded-[14px] overflow-hidden">
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md">
            <span className="text-[9px] font-semibold tracking-widest uppercase text-white/40">Reference</span>
          </div>
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime ?? 0)}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Webcam */}
        <div className="flex-1 relative bg-[#0a0a12] border border-[#1a1a24] rounded-[14px] overflow-hidden">
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md">
            <span className="text-[9px] font-semibold tracking-widest uppercase text-white/40">You</span>
          </div>
          <div className="absolute bottom-2 left-2 z-10">
            <span className="text-[9px] font-semibold text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded-md">
              ● {status}
            </span>
          </div>
          <video
            ref={webcamRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover transform-[scaleX(-1)]"
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="absolute inset-0 w-full h-full transform-[scaleX(-1)]"
          />
        </div>
      </div>

      {/* Steps */}
      <div className="bg-[#0f0f14] border border-[#1a1a24] rounded-[14px] p-4 shrink-0">
        <p className="text-[9px] font-bold tracking-[0.12em] uppercase text-zinc-600 mb-3">Step scores</p>
        <ul className="flex flex-col gap-1">
          {steps.map((step, i) => (
            <li
              key={i}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[9px] border transition-all ${
                i === activeStepIndex
                  ? "bg-[#071e26] border-[#0e4f63]"
                  : "bg-[#0a0a10] border-transparent"
              }`}
            >
              <span className={`text-[10px] font-bold w-4 text-center shrink-0 ${
                i === activeStepIndex ? "text-cyan-400" : "text-zinc-700"
              }`}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className={`flex-1 text-xs ${
                i === activeStepIndex ? "text-[#e0f7fa]" : "text-zinc-500"
              }`}>
                {step.label ?? `Step ${i + 1}`}
              </span>
              <span className="text-xs font-bold" style={{ color: scoreColor(stepScores[i] ?? null) }}>
                {stepScores[i] !== undefined ? stepScores[i] : "—"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Save button */}
      <button
        onClick={async () => {
          if (!danceId || bestScoreRef.current === 0) return;
          setSaving(true);
          await saveProgress({ danceId, score: bestScoreRef.current });
          setSaving(false);
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }}
        disabled={saving || bestScoreRef.current === 0 || !danceId}
        className="w-full py-3.5 rounded-xl text-sm font-bold border-none cursor-pointer shrink-0 transition-all disabled:opacity-40"
        style={{
          background: saved ? "#4ade80" : "#22d3ee",
          color: saved ? "#052e16" : "#083344",
        }}
      >
        {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Progress →"}
      </button>

    </div>
  );
}