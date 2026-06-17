export default function Nav({ tab, setTab, onSignOut, onUpload }) {
  const tabs = ["learn", "practice", "progress"];

  return (
    <>
      <header className="flex items-center justify-between px-4 md:px-6 h-[52px] border-b border-[#111113] bg-[#09090b] flex-shrink-0 w-full">
        <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-cyan-400">
          Dance Coach
        </span>

        <div className="hidden md:flex gap-0.5 bg-[#1c1c1f] rounded-[10px] p-[3px]">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-1.5 rounded-lg text-[13px] font-medium capitalize ${
                tab === t ? "bg-zinc-700 text-white" : "bg-transparent text-zinc-500"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onUpload} className="text-xs font-semibold text-[#083344] bg-cyan-400 rounded-lg px-3 py-1.5">
            + Upload
          </button>
          <button onClick={onSignOut} className="text-xs text-zinc-500">
            Sign out
          </button>
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around bg-[#09090b] border-t border-[#111113] h-14 z-50">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 h-full text-xs font-medium capitalize ${
              tab === t ? "text-cyan-400" : "text-zinc-500"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>
    </>
  );
}