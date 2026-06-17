import { useState, useRef } from "react";

export default function UploadDance({ onClose, onSaved }) {
  const [file, setFile] = useState(null);
  const [stage, setStage] = useState("idle"); // idle | uploading | done | error
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  function pickFile(f) {
    if (!f) return;
    setFile(f);
    setStage("idle");
    setResult(null);
    setError("");
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setStage("uploading");
    setProgress(0);

    // Fake progress while backend processes
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 2, 90));
    }, 300);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://localhost:8000/dances", {
        method: "POST",
        body: formData,
      });

      clearInterval(interval);

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setProgress(100);
      setResult(data);
      setStage("done");
    } catch (err) {
      clearInterval(interval);
      setError(err.message);
      setStage("error");
    }
  }

  function handleSave() {
    if (result) onSaved?.(result);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0f0f14] border border-[#1f1f2e] rounded-[20px] w-full max-w-120 p-8 relative">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-500 text-sm flex items-center justify-center cursor-pointer hover:text-white transition-colors"
        >
          ✕
        </button>

        <h2 className="text-lg font-bold text-white mb-1">Upload Dance</h2>
        <p className="text-[13px] text-zinc-600 mb-6">Upload a video to extract poses and auto-detect steps</p>

        {/* Drop zone */}
        {stage === "idle" && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-[1.5px] border-dashed rounded-[14px] p-10 text-center cursor-pointer transition-all mb-6 ${
              dragging ? "border-cyan-400/60 bg-cyan-400/5" : "border-cyan-400/20 bg-[#0a0a14] hover:border-cyan-400/40 hover:bg-[#0d0d1a]"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="video/mp4,video/mov,video/webm"
              className="hidden"
              onChange={(e) => pickFile(e.target.files[0])}
            />
            <div className="w-12 h-12 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center mx-auto mb-4 text-xl">
              🎬
            </div>
            {file ? (
              <p className="text-sm font-semibold text-white">{file.name}</p>
            ) : (
              <>
                <p className="text-sm font-semibold text-white mb-1">Drop your video here</p>
                <p className="text-xs text-zinc-600">or <span className="text-cyan-400">browse files</span></p>
              </>
            )}
            <div className="flex gap-1.5 justify-center mt-3">
              {["MP4", "MOV", "WEBM"].map((f) => (
                <span key={f} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-500">
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Uploading */}
        {stage === "uploading" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-[10px] p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-base shrink-0">
                🎥
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-white truncate">{file?.name}</p>
                <p className="text-[11px] text-zinc-600 mt-0.5">
                  {progress < 90 ? "Extracting poses…" : "Saving to database…"}
                </p>
                <div className="h-0.75 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <span className="text-[11px] text-cyan-400 font-medium shrink-0">{progress}%</span>
            </div>
          </div>
        )}

        {/* Done — show detected steps */}
        {stage === "done" && result && (
          <>
            <div className="bg-zinc-900 border border-zinc-800 rounded-[10px] p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-400/10 border border-green-400/20 flex items-center justify-center text-base shrink-0">
                  ✅
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-white">{file?.name}</p>
                  <p className="text-[11px] text-green-400 mt-0.5">{result.frame_count} frames extracted</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-[10px] p-4 mb-6">
              <p className="text-[10px] font-semibold tracking-[0.08em] uppercase text-zinc-600 mb-3">
                Detected Steps
              </p>
              <ul className="flex flex-col gap-0">
                {result.steps.map((step, i) => (
                  <li key={i} className="flex items-center gap-2.5 py-2 border-b border-zinc-800 last:border-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                    <span className="flex-1 text-[13px] text-zinc-400">{step.label}</span>
                    <span className="text-[11px] text-zinc-600">{step.startTime}–{step.endTime}s</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* Error */}
        {stage === "error" && (
          <div className="bg-red-400/10 border border-red-400/20 rounded-[10px] p-4 mb-6">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-[10px] bg-zinc-800 border border-zinc-700 text-zinc-400 text-[13px] cursor-pointer hover:text-white transition-colors"
          >
            Cancel
          </button>
          {stage === "idle" && (
            <button
              onClick={handleUpload}
              disabled={!file}
              className="flex-1 py-2.5 rounded-[10px] bg-cyan-400 text-zinc-900 text-[13px] font-bold cursor-pointer disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              Extract Poses →
            </button>
          )}
          {stage === "done" && (
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-[10px] bg-cyan-400 text-zinc-900 text-[13px] font-bold cursor-pointer hover:opacity-90 transition-opacity"
            >
              Save Dance →
            </button>
          )}
          {stage === "error" && (
            <button
              onClick={() => { setStage("idle"); setError(""); }}
              className="flex-1 py-2.5 rounded-[10px] bg-zinc-800 border border-zinc-700 text-zinc-400 text-[13px] cursor-pointer hover:text-white transition-colors"
            >
              Try Again
            </button>
          )}
        </div>

      </div>
    </div>
  );
}