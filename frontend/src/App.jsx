import { useState, useEffect } from "react";
import Nav from "./components/Nav";
import DancePlayer from "./components/DancePlayer";
import PracticeMode from "./components/PracticeMode";

function ProgressPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-zinc-700 gap-3">
      <span className="text-5xl">↑</span>
      <p className="text-sm">Practice a dance to see your progress.</p>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("learn");
  const [keyframes, setKeyframes] = useState([]);
  const [steps, setSteps] = useState([]);


  useEffect(() => {
     // Load precomputed keypoints for scoring
    fetch("/sample-dance-keypoints.json")
      .then((r) => r.json())
      .then(setKeyframes);

    // Load real steps from backend
    fetch("http://localhost:8000/dances/sample-dance")
      .then((r) => r.json())
      .then((data) => setSteps(data.steps ?? []));
  }, []);

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col overflow-hidden">
      <Nav tab={tab} setTab={setTab} />
      <main className="flex-1 px-4 py-2 min-h-0 overflow-hidden" style={{ maxHeight: "calc(100vh - 52px)" }}>
        {tab === "learn" && <DancePlayer videoUrl="/sample-dance.mp4" steps={steps} />}
        {tab === "practice" && <PracticeMode keyframes={keyframes} steps={steps} />}
        {tab === "progress" && <ProgressPlaceholder />}
      </main>
    </div>
  );
}