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

  useEffect(() => {
    if (!session) return;

    fetch("/sample-dance-keypoints.json")
      .then((r) => r.json())
      .then(setKeyframes);

    fetch("http://localhost:8000/dances/by-title/Sample Dance")
      .then((r) => r.json())
      .then((data) => {
        setSteps(data.steps ?? []);
        setDanceId(data.id ?? null);
      });
  }, [session]);

  function handleDanceSaved(result) {
    setSteps(result.steps);
    setDanceId(result.id);
  }

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
        {tab === "learn" && <DancePlayer videoUrl="/sample-dance.mp4" steps={steps} />}
        {tab === "practice" && (
          <PracticeMode
            keyframes={keyframes}
            steps={steps}
            danceId={danceId}
          />
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