import os
import json
import shutil
import tempfile
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from extract_pose import extract_keypoints
from segment_steps import segment_steps
from dotenv import load_dotenv
from uuid import uuid4

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://your-app.vercel.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"],
)

@app.post("/dances")
async def process_dance(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        frames = extract_keypoints(tmp_path)
        steps = segment_steps(frames, min_step_duration=2.5, smoothing_window=8)

        storage_path = f"dances/{uuid4()}{suffix}"
        with open(tmp_path, "rb") as f:
            supabase.storage.from_("videos").upload(
                storage_path, f, {"content-type": "video/mp4", "upsert": "true"}
            )

        video_url = supabase.storage.from_("videos").get_public_url(storage_path)

        title = os.path.splitext(file.filename)[0].replace("-", " ").replace("_", " ").title()
        result = supabase.table("dances").insert({
            "title": title,
            "video_url": video_url,
            "keypoints": frames,
            "steps": steps,
            "difficulty": "beginner",
        }).execute()

        dance = result.data[0]

        return {
            "id": dance["id"],
            "title": dance["title"],
            "steps": steps,
            "frame_count": len(frames),
            "video_url": video_url,
        }

    finally:
        os.unlink(tmp_path)


@app.get("/dances")
async def list_dances():
    result = supabase.table("dances").select("id, title, steps, difficulty, video_url").execute()
    return result.data


@app.get("/dances/by-title/{title}")
async def get_dance_by_title(title: str):
    result = supabase.table("dances").select("*").ilike("title", title).limit(1).execute()
    if not result.data:
        return {"error": "Dance not found"}
    return result.data[0]


@app.get("/dances/{dance_id}")
async def get_dance(dance_id: str):
    result = supabase.table("dances").select("*").eq("id", dance_id).single().execute()
    return result.data


@app.get("/")
async def root():
    return {"status": "ok"}