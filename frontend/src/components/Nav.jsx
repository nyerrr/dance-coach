export default function Nav({ tab, setTab, onSignOut }) {
  const tabs = ["learn", "practice", "progress"];

  return (
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 52, borderBottom: "1px solid #111113", background: "#09090b", flexShrink: 0, width: "100%" }}>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#22d3ee" }}>
        Dance Coach
      </span>
      <div style={{ display: "flex", gap: 2, background: "#1c1c1f", borderRadius: 10, padding: 3 }}>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "6px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500,
              textTransform: "capitalize", border: "none", cursor: "pointer",
              background: tab === t ? "#3f3f46" : "transparent",
              color: tab === t ? "#fff" : "#71717a",
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <button
        onClick={onSignOut}
        style={{ fontSize: 12, color: "#52525b", background: "none", border: "none", cursor: "pointer" }}
      >
        Sign out
      </button>
    </header>
  );
}