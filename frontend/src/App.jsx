import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import Nav from "./components/Nav";
import DancePlayer from "./components/DancePlayer";
import PracticeMode from "./components/PracticeMode";
import Login from "./components/Login";
import Progress from "./components/Progress";
import UploadDance from "./components/UploadDance";

export default function App() {
  const [tab, setTab] = useState("learn");
  const [keyframes, setKeyframes] = useState([]);
  const [steps, setSteps] = useState([]);
  const [danceId, setDanceId] = useState(null);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);

  async function loadDance(idOrTitle, byTitle = false) {
    const API = import.meta.env.VITE_API_URL;
    const url = byTitle
      ? `${API}/dances/by-title/${encodeURIComponent(idOrTitle)}`
      : `${API}/dances/${idOrTitle}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.error) return;
    setSteps(data.steps ?? []);
    setDanceId(data.id ?? null);
    setKeyframes(data.keypoints ?? []);
    setVideoUrl(data.video_url ?? null);
  }

  function handleDanceSaved(result) {
    loadDance(result.id);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);


  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#52525b", fontSize: 13 }}>Loading…</p>
      </div>
    );
  }

  if (!session) return <Login />;

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col overflow-hidden">
      <Nav
        tab={tab}
        setTab={setTab}
        onSignOut={() => supabase.auth.signOut()}
        onUpload={() => setShowUpload(true)}
      />
      <main className="flex-1 px-4 pt-2 pb-16 md:pb-2 min-h-0 overflow-y-auto md:overflow-hidden md:max-h-[calc(100vh-52px)]">
        {tab === "learn" && (
          videoUrl
            ? <DancePlayer videoUrl={videoUrl} steps={steps} />
            : <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p className="text-sm">Import your videos</p>
                <button
                  onClick={() => setShowUpload(true)}
                  className="text-xs text-cyan-500 hover:text-cyan-400 transition-colors"
                >
                  Upload a dance
                </button>
              </div>
        )}
        {tab === "practice" && (
            videoUrl
              ? <PracticeMode videoUrl={videoUrl} keyframes={keyframes} steps={steps} danceId={danceId} />
              : <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <p className="text-sm">No dance loaded</p>
                  <button
                    onClick={() => setShowUpload(true)}
                    className="text-xs text-cyan-500 hover:text-cyan-400 transition-colors"
                  >
                    Upload a dance to start practicing
                  </button>
                </div>
          )}
        {tab === "progress" && <Progress />}
      </main>

      {showUpload && (
        <UploadDance
          onClose={() => setShowUpload(false)}
          onSaved={handleDanceSaved}
        />
      )}
    </div>
  );
}