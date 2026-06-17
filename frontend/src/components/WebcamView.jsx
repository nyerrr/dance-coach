import { useEffect, useRef } from "react";
import { usePoseLandmarker } from "../hooks/usePoseLandmarker";
import { PoseLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";

export default function WebcamView() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { landmarks, status } = usePoseLandmarker(videoRef);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) videoRef.current.srcObject = stream;
    });
  }, []);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 640, 480);
    if (landmarks) {
      const drawingUtils = new DrawingUtils(ctx);
      drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, { color: "#6ee7ff", lineWidth: 3 });
      drawingUtils.drawLandmarks(landmarks, { color: "#ff5fae", radius: 4 });
    }
  }, [landmarks]);

  return (
    <div className="relative w-160 h-120 bg-black rounded-lg overflow-hidden mx-auto">
      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full transform-[scaleX(-1)]" />
      <canvas ref={canvasRef} width={640} height={480} className="absolute inset-0 w-full h-full transform-[scaleX(-1)]" />
      <p className="absolute top-2 left-2 text-xs text-white/70">{status}</p>
    </div>
  );
}