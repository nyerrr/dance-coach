import cv2
import json
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision

MODEL_PATH = "pose_landmarker_lite.task"
VIDEO_PATH = "sample-dance.mp4"  

base_options = mp_python.BaseOptions(model_asset_path=MODEL_PATH)
options = vision.PoseLandmarkerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.VIDEO,
    num_poses=1,
)

def extract_keypoints(video_path):
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    frames = []

    with vision.PoseLandmarker.create_from_options(options) as landmarker:
        frame_index = 0
        while True:
            success, frame = cap.read()
            if not success:
                break

            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            timestamp_ms = int((frame_index / fps) * 1000)

            result = landmarker.detect_for_video(mp_image, timestamp_ms)
            if result.pose_landmarks:
                landmarks = [
                    {"x": lm.x, "y": lm.y, "z": lm.z, "visibility": lm.visibility}
                    for lm in result.pose_landmarks[0]
                ]
            else:
                landmarks = None

            frames.append({"t": frame_index / fps, "landmarks": landmarks})
            frame_index += 1

    cap.release()
    return frames

if __name__ == "__main__":
    data = extract_keypoints(VIDEO_PATH)
    print(f"Extracted {len(data)} frames")
    with open("keypoints.json", "w") as f:
        json.dump(data, f)