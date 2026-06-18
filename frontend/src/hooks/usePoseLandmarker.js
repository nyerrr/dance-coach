import { useEffect, useRef, useState } from 'react';
import { createPoseLandmarker } from "../lib/poseDetector";

const SMOOTH_FRAMES = 5;

export function usePoseLandmarker(videoRef) {
    const [landmarks, setLandmarks] = useState(null);
    const [status, setStatus] = useState("loading");
    const landmarkerRef = useRef(null);
    const lastVideoTimeRef = useRef(-1);
    const rafRef = useRef(null);
    const landmarkHistoryRef = useRef([]);

    useEffect(() => {
        let cancelled = false;

        async function setup() {
            try {
                landmarkerRef.current = await createPoseLandmarker();
                if (cancelled) return;
                setStatus("ready");
                rafRef.current = requestAnimationFrame(loop);
            } catch (error) {
                console.error("Error initializing PoseLandmarker:", error);
                if (!cancelled) setStatus("error");
            }
        }

        function loop() {
            if (cancelled) return;
            const video = videoRef.current;
            const landmarker = landmarkerRef.current;

            if (video && landmarker && video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
                lastVideoTimeRef.current = video.currentTime;
                const result = landmarker.detectForVideo(video, performance.now());
                const raw = result.landmarks?.[0] ?? null;

                if (raw) {
                    // Add to history
                    landmarkHistoryRef.current.push(raw);
                    if (landmarkHistoryRef.current.length > SMOOTH_FRAMES) {
                        landmarkHistoryRef.current.shift();
                    }

                    // Average across history frames
                    const history = landmarkHistoryRef.current;
                    const smoothed = raw.map((_, i) => ({
                        x: history.reduce((sum, f) => sum + f[i].x, 0) / history.length,
                        y: history.reduce((sum, f) => sum + f[i].y, 0) / history.length,
                        z: history.reduce((sum, f) => sum + f[i].z, 0) / history.length,
                        visibility: raw[i].visibility,
                    }));

                    setLandmarks(smoothed);
                } else {
                    landmarkHistoryRef.current = [];
                    setLandmarks(null);
                }
            }

            rafRef.current = requestAnimationFrame(loop);
        }

        setup();

        return () => {
            cancelled = true;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            landmarkerRef.current?.close?.();
        };
    }, [videoRef]);

    return { landmarks, status };
}