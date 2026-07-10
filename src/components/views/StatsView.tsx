"use client";

import { useState, useEffect, useCallback } from "react";
import { T, DAYS, MONTHS, SECTIONS, buildTasks, BIOMARKERS, LAYERS, FOODS } from "@/lib/constants";

interface Project {
  id: string;
  name: string;
  color: string;
  totalSec: number;
}

interface TimeEntry {
  id: string;
  projectId: string;
  date: string;
  durationSec: number;
  project?: Project;
}

interface DailyLog {
  date: string;
  checks: string;
  feeling: number;
  noteText: string;
  pct: number;
}

export function StatsView({
  layer,
  setLayer,
}: {
  layer: number;
  setLayer: (v: number) => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

      const [projRes, entriesRes, logsRes] = await Promise.all([
        fetch("/api/projects"),
        fetch(`/api/time-entries?from=${from}&to=${to}`),
        fetch(`/api/daily?from=${from}&to=${to}`),
      ]);
      const projData = await projRes.json();
      const entriesData = await entriesRes.json();
      setProjects(projData.projects || []);
      setEntries(entriesData.entries || []);
      // daily logs might not have range endpoint — try
      try { const logData = await logsRes.json(); setLogs(logData.logs || []); } catch {}
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const now = new Date();
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const fd = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const cal: (number | null)[] = [];
  for (let i = 0; i < fd; i++) cal.push(null);
  for (let i = 1; i <= dim; i++) cal.push(i);

  // Monthly project totals
  const monthlyProjectMap = new Map<string, number>();
  entries.filter((e) => e.endAt || e.durationSec > 0).forEach((e) => {
    monthlyProjectMap.set(e.projectId, (monthlyProjectMap.get(e.projectId) || 0) + e.durationSec);
  });

  // Total this month
  const monthTotalSec = Array.from(monthlyProjectMap.values()).reduce((s, v) => s + v, 0);

  // Daily totals for calendar heatmap
  const dailyTotals = new Map<string, number>();
  entries.forEach((e) => {
    if (e.durationSec > 0) {
      dailyTotals.set(e.date, (dailyTotals.get(e.date) || 0) + e.durationSec);
    }
  });

  // Current day health
  const dow = now.getDay();
  const tasks = buildTasks(dow);
  const allIds = [...tasks.training, ...tasks.nutrition, ...tasks.mind, ...tasks.sleep].map((t) => t.id);

  const secStats = SECTIONS.map((s) => {
    const items = tasks[s.key];
    return { ...s, done: items.filter((t) => true).length, total: items.length };
  });

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: T.sub }}>Đang tải...</div>;
  }

  return (
    <div style={{ animation: "slideUp .5s cubic-bezier(.4,0,.2,1)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 15, color: T.sub }}>Thống kê</div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, color: T.text }}>{MONTHS[now.getMonth()]}</div>
        </div>
        <div style={{ fontSize: 13, color: T.muted }}>{now.getFullYear()}</div>
      </div>

      {/* Calendar heatmap */}
      <div style={{ background: T.card, borderRadius: T.radius, marginBottom: 16, padding: 14, boxShadow: T.shadow }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>Lịch hoạt động</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {DAYS.map((d) => (
            <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: T.muted, padding: 4 }}>{d}</div>
          ))}
          {cal.map((d, i) => {
            if (!d) return <div key={i} style={{ textAlign: "center", padding: "7px 0", fontSize: 13 }}>·</div>;
            const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const total = dailyTotals.get(dateStr) || 0;
            const hasHealth = logs.some((l) => l.date === dateStr && l.pct > 0);
            const intensity = total > 0 ? Math.min(total / 7200, 1) : 0; // 2h = max
            return (
              <div key={i} style={{
                textAlign: "center", padding: "7px 0", borderRadius: 10,
                fontSize: 13, fontWeight: d === now.getDate() ? 700 : 400,
                color: d === now.getDate() ? "#fff" : T.text,
                background: d === now.getDate() ? T.dark : (total > 0 ? `rgba(202,255,78,${0.15 + intensity * 0.7})` : "transparent"),
                border: hasHealth && d !== now.getDate() ? `1px solid ${T.accent}` : "none",
              }}>{d}</div>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, justifyContent: "flex-end" }}>
          <span style={{ fontSize: 10, color: T.muted }}>Ít</span>
          <div style={{ width: 12, height: 8, borderRadius: 2, background: `rgba(202,255,78,0.15)` }} />
          <div style={{ width: 12, height: 8, borderRadius: 2, background: `rgba(202,255,78,0.5)` }} />
          <div style={{ width: 12, height: 8, borderRadius: 2, background: `rgba(202,255,78,0.85)` }} />
          <span style={{ fontSize: 10, color: T.muted }}>Nhiều</span>
        </div>
      </div>

      {/* Monthly summary */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1, background: T.dark, borderRadius: T.radius, padding: 16, textAlign: "center", boxShadow: T.shadowLg }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>{Math.floor(monthTotalSec / 3600)}h</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>Tổng tháng</div>
        </div>
        <div style={{ flex: 1, background: T.card, borderRadius: T.radius, padding: 16, textAlign: "center", boxShadow: T.shadow }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: T.text }}>{entries.filter((e) => e.durationSec > 0).length}</div>
          <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>phiên</div>
        </div>
      </div>

      {/* Monthly project breakdown */}
      {monthlyProjectMap.size > 0 && (
        <div style={{ background: T.card, borderRadius: T.radius, padding: 16, marginBottom: 16, boxShadow: T.shadow }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Theo project</div>
          {projects
            .filter((p) => monthlyProjectMap.has(p.id))
            .sort((a, b) => (monthlyProjectMap.get(b.id) || 0) - (monthlyProjectMap.get(a.id) || 0))
            .map((p) => {
              const sec = monthlyProjectMap.get(p.id) || 0;
              const pct = monthTotalSec > 0 ? Math.round((sec / monthTotalSec) * 100) : 0;
              return (
                <div key={p.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: p.color }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.text, flex: 1 }}>{p.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.sub }}>{Math.floor(sec / 3600)}h {Math.floor((sec % 3600) / 60)}m</span>
                  </div>
                  <div style={{ height: 4, background: T.border, borderRadius: 2 }}>
                    <div style={{ height: 4, background: p.color, borderRadius: 2, width: `${pct}%`, transition: "width .5s" }} />
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* System / Layers */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, padding: "0 2px" }}>Hệ thống</div>
        <div style={{ background: T.dark, borderRadius: T.radius, padding: 12, marginBottom: 8, boxShadow: T.shadowLg }}>
          <div style={{ display: "flex", gap: 6 }}>
            {LAYERS.map((l) => (
              <button key={l.id} onClick={() => setLayer(l.id)} style={{
                flex: 1, padding: "12px 8px", borderRadius: 12, border: "none", cursor: "pointer",
                background: layer === l.id ? T.accent : "#333", transition: "all .2s",
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: layer === l.id ? T.accentDark : "#888" }}>Layer {l.id}</div>
                <div style={{ fontSize: 10, color: layer === l.id ? T.accentDark : "#666", marginTop: 2 }}>{l.name}</div>
              </button>
            ))}
          </div>
        </div>
        {LAYERS.filter((l) => l.id === layer).map((l) => (
          <div key={l.id} style={{ background: T.card, borderRadius: T.radius, padding: 16, marginBottom: 8, boxShadow: T.shadow }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{l.name}</div>
                <div style={{ fontSize: 12, color: T.sub }}>{l.period}</div>
              </div>
              <span style={{ fontSize: 9, padding: "3px 10px", background: T.accent, color: T.accentDark, borderRadius: 8, fontWeight: 700 }}>ACTIVE</span>
            </div>
            {l.focus.map((f, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 0",
                borderBottom: i < l.focus.length - 1 ? `1px solid ${T.border}` : "none",
              }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: T.dark }} />
                <span style={{ fontSize: 14, color: T.text, fontWeight: 500 }}>{f}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Biomarkers */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, padding: "0 2px" }}>Chỉ số cốt lõi</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {BIOMARKERS.map((b) => (
            <div key={b.name} style={{ background: T.card, borderRadius: T.radius, padding: 14, boxShadow: T.shadow }}>
              <div style={{ fontSize: 11, color: T.sub, fontWeight: 600, marginBottom: 6 }}>{b.name}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: -0.5 }}>{b.target}</div>
              <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{b.unit}{b.unit ? " · " : ""}{b.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Foods */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, padding: "0 2px" }}>Thực phẩm</div>
        <div style={{ background: T.card, borderRadius: T.radius, padding: 14, boxShadow: T.shadow }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {FOODS.map((f) => (
              <div key={f.n} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", background: T.bg, borderRadius: 10 }}>
                <span style={{ fontSize: 14 }}>{f.e}</span>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{f.n}</span>
                  <span style={{ fontSize: 10, color: T.muted, marginLeft: 4 }}>{f.p}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quote */}
      <div style={{ textAlign: "center", padding: "12px 0 8px" }}>
        <div style={{ fontSize: 13, color: T.muted, fontStyle: "italic", lineHeight: 1.6 }}>
          "Bền bỉ thắng hoàn hảo."
        </div>
      </div>
    </div>
  );
}
