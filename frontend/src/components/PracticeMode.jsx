import { useRef, useEffect, useState } from "react";
import { usePoseLandmarker } from "../hooks/usePoseLandmarker";
import { PoseLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";

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

export default function PracticeMode({ keyframes = [], steps = [] }) {
  const videoRef = useRef(null);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const { landmarks, status } = usePoseLandmarker(webcamRef);

  const [score, setScore] = useState(null);
  const [stepScores, setStepScores] = useState({});
  const [currentTime, setCurrentTime] = useState(0);

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

  return (
    <div style={{ display: "flex", gap: 12, height: "100%", width: "100%", overflow: "hidden" }}>

      {/* Reference video */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>
          Reference
        </p>
        <div style={{ flex: 1, background: "#000", borderRadius: 16, overflow: "hidden", minHeight: 0 }}>
          <video
            ref={videoRef}
            src="/sample-dance.mp4"
            controls
            onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime ?? 0)}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>
      </div>

      {/* Webcam */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>
          You <span style={{ color: "#22d3ee" }}>({status})</span>
        </p>
        <div style={{ flex: 1, position: "relative", background: "#000", borderRadius: 16, overflow: "hidden", minHeight: 0 }}>
          <video ref={webcamRef} autoPlay playsInline muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
          <canvas ref={canvasRef} width={640} height={480} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", transform: "scaleX(-1)" }} />
        </div>
      </div>

      {/* Score sidebar */}
      <div style={{ width: 200, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Live score */}
        <div style={{ background: "#111113", borderRadius: 12, border: "1px solid #1f1f23", padding: 16, textAlign: "center" }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#52525b", marginBottom: 8 }}>
            Match score
          </p>
          <p style={{ fontSize: 48, fontWeight: 600, lineHeight: 1, color: scoreColor(score) }}>
            {score !== null ? score : "—"}
          </p>
        </div>

        {/* Step scores */}
        <div style={{ background: "#111113", borderRadius: 12, border: "1px solid #1f1f23", padding: 16, flex: 1 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#52525b", marginBottom: 12 }}>
            Steps
          </p>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
            {steps.map((step, i) => (
              <li key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "#a1a1aa" }}>{step.label ?? `Step ${i + 1}`}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: scoreColor(stepScores[i] ?? null) }}>
                  {stepScores[i] !== undefined ? stepScores[i] : "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}