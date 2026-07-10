"use client";

import { useState, useEffect } from "react";
import { T } from "@/lib/constants";
import { TodayView } from "@/components/views/TodayView";
import { ProjectsView } from "@/components/views/ProjectsView";
import { WeekView } from "@/components/views/WeekView";
import { StatsView } from "@/components/views/StatsView";

type Tab = "today" | "projects" | "week" | "stats";

const KEY = "dongbao_os_v5";

export default function Home() {
  const [tab, setTab] = useState<Tab>("today");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [feeling, setFeeling] = useState(0);
  const [noteText, setNoteText] = useState("");
  const [layer, setLayer] = useState(1);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const s = localStorage.getItem(KEY);
      if (s) {
        const d = JSON.parse(s);
        if (d.checks) setChecks(d.checks);
        if (d.feeling) setFeeling(d.feeling);
        if (d.noteText) setNoteText(d.noteText);
        if (d.layer) setLayer(d.layer);
        if (d.tab) setTab(d.tab);
      }
    } catch {}
    setLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ checks, feeling, noteText, layer, tab }));
    } catch {}
  }, [checks, feeling, noteText, layer, tab, loaded]);

  const now = new Date();
  const dow = now.getDay();
  // Simple pct for top bar
  const allTaskIds = [
    "t_main", "t_walk", "t_collagen",
    "n_protein", "n_veg", "n_water", "n_stop",
    "m_read", "m_note", "m_breath",
    "s_time", "s_screen",
  ].filter((id) => {
    if (id === "t_collagen") return dow >= 1 && dow <= 5 && dow % 2 === 1;
    return true;
  });
  const doneCount = allTaskIds.filter((id) => checks[id]).length;
  const pct = allTaskIds.length > 0 ? Math.round((doneCount / allTaskIds.length) * 100) : 0;

  const tabList = [
    { id: "today" as Tab, label: "Hôm nay", icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="11" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="3" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="11" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    )},
    { id: "projects" as Tab, label: "Projects", icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10 10L13.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M10 3V5M10 15V17M3 10H5M15 10H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )},
    { id: "week" as Tab, label: "Tuần", icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3 8H17" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M13 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )},
    { id: "stats" as Tab, label: "Thống kê", icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 16V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M8 16V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M12 16V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M16 16V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    )},
  ];

  if (!loaded) {
    return <div style={{ minHeight: "100vh", background: T.bg }} />;
  }

  return (
    <div style={{
      minHeight: "100vh", background: T.bg,
      fontFamily: "'SF Pro Display', -apple-system, 'Helvetica Neue', sans-serif",
      maxWidth: 430, margin: "0 auto", WebkitFontSmoothing: "antialiased",
    }}>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { font-family: inherit; }
        input, textarea { outline: none; font-family: inherit; }
        ::placeholder { color: ${T.muted}; }
        ::-webkit-scrollbar { width: 0; }
      `}</style>

      {/* Top bar */}
      <div style={{
        padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "sticky", top: 0, zIndex: 10, background: `${T.bg}ee`,
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.5, color: T.text }}>
          dongbao<span style={{ fontWeight: 400, color: T.muted }}>OS</span>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "4px 10px", background: T.card, borderRadius: 10,
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: T.sub }}>L{layer}</span>
          <div style={{ width: 1, height: 12, background: T.border }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: pct === 100 ? T.green : T.text }}>{pct}%</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "8px 16px 90px" }}>
        {tab === "today" && (
          <TodayView
            checks={checks}
            setChecks={setChecks}
            feeling={feeling}
            setFeeling={setFeeling}
            noteText={noteText}
            setNoteText={setNoteText}
            layer={layer}
            pct={pct}
          />
        )}
        {tab === "projects" && <ProjectsView />}
        {tab === "week" && <WeekView />}
        {tab === "stats" && <StatsView layer={layer} setLayer={setLayer} />}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430,
        background: `${T.bg}dd`, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderTop: `1px solid ${T.border}`,
        padding: "6px 8px 10px", display: "flex", justifyContent: "space-around", zIndex: 10,
      }}>
        {tabList.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: "none", border: "none", cursor: "pointer", padding: "4px 12px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            color: tab === t.id ? T.text : T.muted, transition: "color .2s",
          }}>
            <div style={{ opacity: tab === t.id ? 1 : 0.4, transition: "opacity .2s" }}>{t.icon}</div>
            <span style={{ fontSize: 9, fontWeight: tab === t.id ? 700 : 500, letterSpacing: 0.3 }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
