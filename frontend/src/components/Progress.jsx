import { useEffect, useState } from "react";
import { fetchProgress } from "../lib/progress";

function scoreColor(s) {
  if (s >= 80) return "#4ade80";
  if (s >= 50) return "#facc15";
  return "#f87171";
}

function statusBadge(s) {
  const map = {
    expert: { bg: "bg-green-400/10 border-green-400/20", text: "text-green-400" },
    intermediate: { bg: "bg-yellow-400/10 border-yellow-400/20", text: "text-yellow-400" },
    beginner: { bg: "bg-zinc-800 border-zinc-700", text: "text-zinc-400" },
  };
  return map[s] ?? map.beginner;
}

export default function Progress() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress().then((data) => {
      setRows(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
        Loading…
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-700 gap-3">
        <span className="text-5xl">↑</span>
        <p className="text-sm">Practice a dance to see your progress.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-3">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-6">Your Progress</h2>
      {rows.map((row) => {
        const badge = statusBadge(row.status);
        return (
          <div key={row.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {row.dances?.title ?? "Dance"}
              </p>
              <p className="text-xs text-zinc-600 mt-0.5">
                Last practiced {new Date(row.last_practiced_at).toLocaleDateString()}
              </p>
            </div>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize ${badge.bg} ${badge.text}`}>
              {row.status}
            </span>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold" style={{ color: scoreColor(row.best_score) }}>
                {row.best_score}
              </p>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider">best</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}