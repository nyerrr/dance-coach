import os
import json
import shutil
import tempfile
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from extract_pose import extract_keypoints
from segment_steps import segment_steps

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTPUT_DIR = "processed"
os.makedirs(OUTPUT_DIR, exist_ok=True)

@app.post("/dances")
async def process_dance(file: UploadFile = File(...)):
    # 1. Save upload to a temp file
    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        # 2. Extract keypoints
        frames = extract_keypoints(tmp_path)

        # 3. Segment steps
        steps = segment_steps(frames, min_step_duration=2.5, smoothing_window=8)

        # 4. Save results
        dance_id = file.filename.replace(" ", "_").replace(suffix, "")
        result = {
            "id": dance_id,
            "title": dance_id,
            "keyframes": frames,
            "steps": steps,
        }

        out_path = os.path.join(OUTPUT_DIR, f"{dance_id}.json")
        with open(out_path, "w") as f:
            json.dump(result, f)

        return {
            "id": dance_id,
            "steps": steps,
            "frame_count": len(frames),
        }

    finally:
        os.unlink(tmp_path)

@app.get("/dances/{dance_id}")
async def get_dance(dance_id: str):
    out_path = os.path.join(OUTPUT_DIR, f"{dance_id}.json")
    if not os.path.exists(out_path):
        return {"error": "Dance not found"}, 404
    with open(out_path) as f:
        return json.load(f)

@app.get("/")
async def root():
    return {"status": "ok"}