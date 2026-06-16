import { useState, useEffect } from "react";
import Nav from "./components/Nav";
import DancePlayer from "./components/DancePlayer";
import PracticeMode from "./components/PracticeMode";

const mockSteps = [
  { label: "Intro sway", startTime: 0, endTime: 3 },
  { label: "Arm wave", startTime: 3, endTime: 6.5 },
  { label: "Hip step", startTime: 6.5, endTime: 10 },
];

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

  useEffect(() => {
    fetch("/sample-dance-keypoints.json")
      .then((r) => r.json())
      .then(setKeyframes);
  }, []);

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col overflow-hidden">
      <Nav tab={tab} setTab={setTab} />
      <main className="flex-1 px-4 py-2 min-h-0 overflow-hidden" style={{ maxHeight: "calc(100vh - 52px)" }}>
        {tab === "learn" && <DancePlayer videoUrl="/sample-dance.mp4" steps={mockSteps} />}
        {tab === "practice" && <PracticeMode keyframes={keyframes} steps={mockSteps} />}
        {tab === "progress" && <ProgressPlaceholder />}
      </main>
    </div>
  );
}