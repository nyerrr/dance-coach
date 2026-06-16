import { useEffect, useRef, useState } from 'react';
import { createPoseLandmarker } from "../lib/poseDetector";

export function usePoseLandmarker(videoRef) {
    const [landmarks, setLandmarks] = useState(null);
    const [status, setStatus] = useState("loading");
    const landmarkerRef = useRef(null);
    const lastVideoTimeRef = useRef(-1);
    const rafRef = useRef(null);

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
                setLandmarks(result.landmarks?.[0] ?? null);
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