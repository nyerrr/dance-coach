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
  if (s === null) return "#71717a";
  if (s >= 80) return "#4ade80";
  if (s >= 50) return "#facc15";
  return "#f87171";
}

export default function PracticeMode({  videoUrl, keyframes = [], steps = [], danceId }) {
  const videoRef = useRef(null);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const { landmarks, status } = usePoseLandmarker(webcamRef);

  const [score, setScore] = useState(null);
  const [stepScores, setStepScores] = useState({});
  const [currentTime, setCurrentTime] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const bestScoreRef = useRef(0);

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
      drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, { color: "#6ee7ff", lineWidth: 2 });
      drawingUtils.drawLandmarks(landmarks, { color: "#ff5fae", radius: 3 });
    }
  }, [landmarks]);

  useEffect(() => {
    if (!landmarks || !keyframes.length) return;
    const refLandmarks = findRefLandmarks(keyframes, currentTime);
    const s = computeScore(landmarks, refLandmarks);
    setScore(s);
    if (s !== null && s > bestScoreRef.current) bestScoreRef.current = s;

    const activeStep = steps.findIndex(
      (step) => currentTime >= step.startTime && currentTime < step.endTime
    );
    if (activeStep !== -1 && s !== null) {
      setStepScores((prev) => ({
        ...prev,
        [activeStep]: Math.round(((prev[activeStep] ?? s) + s) / 2),
      }));
    }
  }, [landmarks, currentTime, keyframes, steps, danceId]);

  return (
    <div className="flex flex-col md:flex-row gap-3 w-full md:h-full overflow-hidden -mx-2 md:mx-0">

      <div className="flex gap-2 md:flex-1 md:min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <p className="text-[11px] tracking-wider uppercase text-white/30 mb-1">Reference</p>
          <div className="relative bg-black rounded-2xl overflow-hidden aspect-9/16 md:aspect-auto md:flex-1 md:min-h-0">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime ?? 0)}
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <p className="text-[11px] tracking-wider uppercase text-white/30 mb-1">
            You <span className="text-cyan-400">({status})</span>
          </p>
          <div className="relative bg-black rounded-2xl overflow-hidden aspect-9/16 md:aspect-auto md:flex-1 md:min-h-0">
            <video ref={webcamRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover transform-[scaleX(-1)]" />
            <canvas ref={canvasRef} width={640} height={480} className="absolute inset-0 w-full h-full transform-[scaleX(-1)]" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full md:w-50 md:shrink-0">
        <div className="flex md:flex-col gap-3">
          <div className="flex-1 bg-[#111113] rounded-xl border border-[#1f1f23] p-2 md:p-4 text-center">
            <p className="text-[9px] md:text-[10px] font-semibold tracking-widest uppercase text-zinc-600 mb-1 md:mb-2">Match score</p>
            <p className="text-2xl md:text-5xl font-semibold leading-none" style={{ color: scoreColor(score) }}>
              {score !== null ? score : "—"}
            </p>
          </div>

          <div className="flex-1 bg-[#111113] rounded-xl border border-[#1f1f23] p-2 md:p-4 text-center">
            <p className="text-[9px] md:text-[10px] font-semibold tracking-widest uppercase text-zinc-600 mb-1 md:mb-2">Best this session</p>
            <p className="text-2xl md:text-3xl font-semibold leading-none" style={{ color: scoreColor(bestScoreRef.current) }}>
              {bestScoreRef.current > 0 ? bestScoreRef.current : "—"}
            </p>
          </div>
        </div>
        <div className="bg-[#111113] rounded-xl border border-[#1f1f23] p-4 flex-1 min-h-0 max-h-48 md:max-h-none overflow-auto">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-600 mb-3">Steps</p>
          <ul className="flex flex-col gap-2">
            {steps.map((step, i) => (
              <li key={i} className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">{step.label ?? `Step ${i + 1}`}</span>
                <span className="text-sm font-semibold" style={{ color: scoreColor(stepScores[i] ?? null) }}>
                  {stepScores[i] !== undefined ? stepScores[i] : "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>

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
          className="w-full py-3 rounded-[10px] text-[13px] font-bold transition-all"
          style={{
            background: saved ? "#4ade80" : "#22d3ee",
            color: saved ? "#052e16" : "#083344",
            opacity: (saving || bestScoreRef.current === 0 || !danceId) ? 0.4 : 1,
          }}
        >
          {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Progress"}
        </button>
      </div>
    </div>
  );
}