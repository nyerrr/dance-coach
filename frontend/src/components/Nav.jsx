export default function Nav({ tab, setTab }) {
  const tabs = ["learn", "practice", "progress"];

  return (
    <header className="flex items-center justify-between px-6 h-13 border-b border-zinc-900 bg-zinc-950 shrink-0 w-full">
      <span className="text-[11px] font-semibold tracking-[0.12em] text-cyan-400 uppercase">
        Dance Coach
      </span>
      <div style={{ display: "flex", gap: 2, background: "#1c1c1f", borderRadius: 10, padding: 3 }}>
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => setTab(t)}
          style={{
            padding: "6px 20px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            textTransform: "capitalize",
            border: "none",
            cursor: "pointer",
            background: tab === t ? "#3f3f46" : "transparent",
            color: tab === t ? "#fff" : "#71717a",
          }}
        >
          {t}
        </button>
      ))}
    </div>
      <div className="w-22.5" />
    </header>
  );
}