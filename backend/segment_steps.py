import json
import math

def compute_velocity(prev_landmarks, curr_landmarks):
    if not prev_landmarks or not curr_landmarks:
        return 0
    total = 0
    for p, c in zip(prev_landmarks, curr_landmarks):
        if p and c:
            total += math.hypot(c["x"] - p["x"], c["y"] - p["y"])
    return total

def segment_steps(frames, min_step_duration=1.0, smoothing_window=5):
    # Compute per-frame velocity
    velocities = [0.0]
    for i in range(1, len(frames)):
        v = compute_velocity(
            frames[i - 1]["landmarks"],
            frames[i]["landmarks"]
        )
        velocities.append(v)

    # Smooth velocities to remove noise
    smoothed = []
    for i in range(len(velocities)):
        start = max(0, i - smoothing_window // 2)
        end = min(len(velocities), i + smoothing_window // 2 + 1)
        smoothed.append(sum(velocities[start:end]) / (end - start))

    # Find local minima as step boundaries
    threshold = sum(smoothed) / len(smoothed) * 0.5
    boundaries = [0.0]

    last_boundary_t = 0.0
    for i in range(1, len(smoothed) - 1):
        t = frames[i]["t"]
        if (
            smoothed[i] < threshold
            and smoothed[i] <= smoothed[i - 1]
            and smoothed[i] <= smoothed[i + 1]
            and (t - last_boundary_t) >= min_step_duration
        ):
            boundaries.append(t)
            last_boundary_t = t

    boundaries.append(frames[-1]["t"])

    # Build step list
    steps = []
    for i in range(len(boundaries) - 1):
        steps.append({
            "label": f"Step {i + 1}",
            "startTime": round(boundaries[i], 2),
            "endTime": round(boundaries[i + 1], 2),
        })

    return steps


if __name__ == "__main__":
    with open("keypoints.json") as f:
        frames = json.load(f)

    steps = segment_steps(frames, min_step_duration=2.5, smoothing_window=8)
    print(f"Found {len(steps)} steps:")
    for s in steps:
        print(f"  {s['label']}: {s['startTime']}s → {s['endTime']}s")