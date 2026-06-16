import { createPoseLandmarker } from "./poseDetector";

export async function recordKeypoints(videoElement, onProgress) {
  const landmarker = await createPoseLandmarker();
  const keyframes = [];
  const duration = videoElement.duration;

  return new Promise((resolve, reject) => {
    videoElement.pause();
    videoElement.currentTime = 0;

    function seekNextFrame(time) {
      if (time > duration) {
        landmarker.close();
        resolve(keyframes);
        return;
      }

      videoElement.currentTime = time;
    }

    videoElement.onseeked = () => {
      try {
        const result = landmarker.detectForVideo(videoElement, performance.now());
        if (result.landmarks?.[0]) {
          keyframes.push({
            t: videoElement.currentTime,
            landmarks: result.landmarks[0].map(({ x, y, z, visibility }) => ({
              x, y, z, visibility,
            })),
          });
        }
      } catch (e) {
        // skip frame
      }

      const progress = videoElement.currentTime / duration;
      onProgress?.(progress);

      // sample every 100ms (10 fps) — enough for smooth scoring
      seekNextFrame(videoElement.currentTime + 0.1);
    };

    videoElement.onerror = reject;
    seekNextFrame(0);
  });
}