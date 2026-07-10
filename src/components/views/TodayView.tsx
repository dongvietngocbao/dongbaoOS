"use client";

import { useState, useEffect } from "react";
import { T, DAYS, MONTHS, TRAINING, buildTasks, SECTIONS } from "@/lib/constants";

interface TodayViewProps {
  checks: Record<string, boolean>;
  setChecks: (v: Record<string, boolean>) => void;
  feeling: number;
  setFeeling: (v: number) => void;
  noteText: string;
  setNoteText: (v: string) => void;
  layer: number;
  pct: number;
}

export function TodayView({ checks, setChecks, feeling, setFeeling, noteText, setNoteText, layer, pct }: TodayViewProps) {
  const [openSec, setOpenSec] = useState<Record<string, boolean>>({ training: true, nutrition: true, mind: true, sleep: true });
  const [dateKey, setDateKey] = useState("");

  const now = new Date();
  const dow = now.getDay();
  const tasks = buildTasks(dow);
  const allIds = [...tasks.training, ...tasks.nutrition, ...tasks.mind, ...tasks.sleep].map((t) => t.id);
  const doneCount = allIds.filter((id) => checks[id]).length;
  const totalCount = allIds.length;
  const todayPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const greetH = now.getHours();
  const greet = greetH < 12 ? "Chào buổi sáng" : greetH < 18 ? "Chào buổi chiều" : "Chào buổi tối";
  const training = TRAINING[dow];

  const toggle = (id: string) => setChecks({ ...checks, [id]: !checks[id] });
  const toggleSec = (k: string) => setOpenSec({ ...openSec, [k]: !openSec[k] });

  useEffect(() => {
    setDateKey(now.toISOString().slice(0, 10));
  }, []);

  // Save to API when checks change
  useEffect(() => {
    if (!dateKey) return;
    fetch("/api/daily", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: dateKey,
        checks,
        feeling,
        noteText,
        layer,
        pct: todayPct,
      }),
    }).catch(() => {});
  }, [checks, feeling, noteText, dateKey, layer]);

  const Card = ({ children, dark, style, onClick }: { children: React.ReactNode; dark?: boolean; style?: React.CSSProperties; onClick?: () => void }) => (
    <div onClick={onClick} style={{
      background: dark ? T.dark : T.card,
      borderRadius: T.radius, padding: 18,
      boxShadow: dark ? T.shadowLg : T.shadow,
      ...(onClick ? { cursor: "pointer" } : {}),
      ...style,
    }}>{children}</div>
  );

  const CheckItem = ({ checked, label, sub, onToggle }: { checked: boolean; label: string; sub?: string; onToggle: () => void }) => (
    <button onClick={onToggle} style={{
      display: "flex", alignItems: "center", gap: 14, padding: "13px 0",
      background: "none", border: "none", width: "100%", textAlign: "left",
      cursor: "pointer", borderBottom: `1px solid ${T.border}`,
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: 22, flexShrink: 0,
        border: `2px solid ${checked ? T.green : T.muted}`,
        background: checked ? T.green : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all .25s cubic-bezier(.4,0,.2,1)",
      }}>
        {checked && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.3, color: checked ? T.sub : T.text, textDecoration: checked ? "line-through" : "none", transition: "all .25s" }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>{sub}</div>}
      </div>
      {checked && <span style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>Done</span>}
    </button>
  );

  const SectionHead = ({ icon, label, done, total, sKey }: { icon: string; label: string; done: number; total: number; sKey: string }) => (
    <button onClick={() => toggleSec(sKey)} style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      width: "100%", padding: "16px 0 6px", background: "none", border: "none", cursor: "pointer",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 10, color: T.sub }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 1.5 }}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {done === total && total > 0 && <span style={{ fontSize: 9, padding: "2px 7px", background: T.accent, color: T.accentDark, borderRadius: 6, fontWeight: 700 }}>DONE</span>}
        <span style={{ fontSize: 12, fontWeight: 600, color: done === total && total > 0 ? T.green : T.muted }}>{done}/{total}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" style={{ transform: openSec[sKey] ? "rotate(0)" : "rotate(-90deg)", transition: "transform .2s" }}><path d="M3 4.5L6 7.5L9 4.5" stroke={T.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
      </div>
    </button>
  );

  const ProgressRing = ({ size, stroke, pct: p, children }: { size: number; stroke: number; pct: number; children?: React.ReactNode }) => {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    return (
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border} strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={p >= 100 ? T.green : T.dark}
            strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c - (p/100)*c}
            strokeLinecap="round" style={{ transition: "stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>{children}</div>
      </div>
    );
  };

  const secCounts = SECTIONS.map((s) => {
    const items = tasks[s.key];
    return { ...s, done: items.filter((t) => checks[t.id]).length, total: items.length };
  });

  return (
    <div style={{ animation: "slideUp .5s cubic-bezier(.4,0,.2,1)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 15, color: T.sub, fontWeight: 400 }}>{greet}</div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, color: T.text, marginTop: 2 }}>dongbao</div>
        </div>
        <ProgressRing size={54} stroke={3.5} pct={todayPct}>
          <span style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{doneCount}</span>
        </ProgressRing>
      </div>

      <Card dark style={{ marginBottom: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: T.accent, opacity: 0.08 }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>Hôm nay · {DAYS[dow]}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>{training.label}</div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>{training.desc}</div>
          </div>
          <div style={{
            padding: "6px 14px", borderRadius: 10,
            background: training.type === "strength" ? T.accent : training.type === "cardio" ? "#fff" : "#444",
            color: training.type === "strength" ? T.accentDark : training.type === "cardio" ? T.dark : "#fff",
            fontSize: 12, fontWeight: 700,
          }}>{training.time}</div>
        </div>
      </Card>

      <Card style={{ marginBottom: 16, padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: T.sub, letterSpacing: 0.5 }}>Năng lượng</span>
          {feeling > 0 && <span style={{ fontSize: 24, fontWeight: 800, color: feeling >= 7 ? T.green : feeling >= 4 ? T.text : T.red }}>{feeling}</span>}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[1,2,3,4,5,6,7,8,9,10].map((n) => (
            <button key={n} onClick={() => setFeeling(n)} style={{
              flex: 1, height: 28, borderRadius: 8, border: "none", cursor: "pointer",
              background: n <= feeling ? (feeling >= 7 ? T.green : feeling >= 4 ? T.dark : T.red) : T.border,
              transition: "all .15s cubic-bezier(.4,0,.2,1)",
            }} />
          ))}
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        {SECTIONS.map((sec) => {
          const items = tasks[sec.key];
          const secDone = items.filter((t) => checks[t.id]).length;
          return (
            <div key={sec.key}>
              <SectionHead icon={sec.icon} label={sec.label} done={secDone} total={items.length} sKey={sec.key} />
              {openSec[sec.key] && (
                <div style={{ animation: "fadeIn .3s ease" }}>
                  {items.map((t) => (
                    <CheckItem key={t.id} checked={!!checks[t.id]} label={t.label} sub={t.sub} onToggle={() => toggle(t.id)} />
                  ))}
                  {sec.key === "mind" && (
                    <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Ghi chú hôm nay..."
                      style={{
                        width: "100%", minHeight: 48, padding: "10px 0", background: "none",
                        border: "none", borderBottom: `1px solid ${T.border}`, color: T.text,
                        fontSize: 14, resize: "none", fontFamily: "inherit",
                      }} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </Card>

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <div style={{
          flex: 1, background: todayPct === 100 ? T.accent : T.border,
          borderRadius: T.radiusSm, padding: "14px 16px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: todayPct === 100 ? T.accentDark : T.sub }}>{todayPct}%</span>
          <span style={{ fontSize: 11, color: todayPct === 100 ? T.accentDark : T.sub }}>hoàn thành</span>
        </div>
        <button onClick={() => { setChecks({}); setFeeling(0); setNoteText(""); }} style={{
          padding: "14px 18px", background: T.card, border: `1px solid ${T.border}`,
          borderRadius: T.radiusSm, cursor: "pointer", fontSize: 12, color: T.sub, fontWeight: 600,
          fontFamily: "inherit",
        }}>Ngày mới</button>
      </div>
    </div>
  );
}
