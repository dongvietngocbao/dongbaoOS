"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { T, fmtDuration, fmtTimer } from "@/lib/constants";

interface Project {
  id: string;
  name: string;
  slug: string;
  color: string;
  description: string;
  totalSec: number;
}

interface TimeEntry {
  id: string;
  projectId: string;
  date: string;
  startAt: string;
  endAt: string | null;
  durationSec: number;
  note: string;
  project?: Project;
}

export function ProjectsView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [runningEntry, setRunningEntry] = useState<TimeEntry | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSeed, setShowSeed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const fetchData = useCallback(async () => {
    try {
      const [projRes, entriesRes, runningRes] = await Promise.all([
        fetch("/api/projects"),
        fetch(`/api/time-entries?date=${today}`),
        fetch("/api/time-entries?running=true"),
      ]);
      const projData = await projRes.json();
      const entriesData = await entriesRes.json();
      const runningData = await runningRes.json();

      if (projData.projects?.length > 0) {
        setProjects(projData.projects);
      } else {
        setShowSeed(true);
      }
      setEntries(entriesData.entries || []);
      setRunningEntry(runningData.entry || null);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Timer tick
  useEffect(() => {
    if (runningEntry) {
      const updateElapsed = () => {
        const start = new Date(runningEntry.startAt).getTime();
        const now = Date.now();
        setElapsedSec(Math.floor((now - start) / 1000));
      };
      updateElapsed();
      timerRef.current = setInterval(updateElapsed, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    } else {
      setElapsedSec(0);
    }
  }, [runningEntry]);

  const handleSeed = async () => {
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "seed" }),
    });
    setShowSeed(false);
    fetchData();
  };

  const handleStart = async (projectId: string) => {
    await fetch("/api/time-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", projectId }),
    });
    fetchData();
  };

  const handleStop = async () => {
    if (!runningEntry) return;
    await fetch("/api/time-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stop", entryId: runningEntry.id }),
    });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/time-entries?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  // Today's total time
  const todayTotalSec = entries
    .filter((e) => e.endAt)
    .reduce((sum, e) => sum + e.durationSec, 0);
  const todayTotalWithRunning = todayTotalSec + (runningEntry ? elapsedSec : 0);

  // Per-project today total
  const projectTodayMap = new Map<string, number>();
  entries.filter((e) => e.endAt).forEach((e) => {
    projectTodayMap.set(e.projectId, (projectTodayMap.get(e.projectId) || 0) + e.durationSec);
  });
  if (runningEntry) {
    projectTodayMap.set(runningEntry.projectId, (projectTodayMap.get(runningEntry.projectId) || 0) + elapsedSec);
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: T.sub }}>Đang tải...</div>;
  }

  return (
    <div style={{ animation: "slideUp .5s cubic-bezier(.4,0,.2,1)" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, color: T.sub }}>24h Quản trị</div>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, color: T.text }}>Projects</div>
      </div>

      {/* Today total */}
      <div style={{
        background: T.dark, borderRadius: T.radius, padding: 20, marginBottom: 16,
        boxShadow: T.shadowLg, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: T.accent, opacity: 0.08 }} />
        <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Tổng thời gian hôm nay</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: -1 }}>
          {fmtDuration(todayTotalWithRunning)}
        </div>
        {runningEntry && (
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: T.green, animation: "pulse 1.5s ease-in-out infinite" }} />
            <span style={{ fontSize: 13, color: T.accent, fontWeight: 600 }}>
              {runningEntry.project?.name || "—"} · {fmtTimer(elapsedSec)}
            </span>
          </div>
        )}
      </div>

      {/* Running timer controls */}
      {runningEntry && (
        <button onClick={handleStop} style={{
          width: "100%", padding: 16, background: T.red, color: "#fff",
          border: "none", borderRadius: T.radiusSm, cursor: "pointer",
          fontSize: 15, fontWeight: 700, marginBottom: 16, fontFamily: "inherit",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: "0 4px 16px rgba(255,59,48,0.3)",
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16"><rect x="3" y="3" width="10" height="10" rx="2" fill="#fff"/></svg>
          Dừng · {fmtTimer(elapsedSec)}
        </button>
      )}

      {/* Seed prompt */}
      {showSeed && (
        <div style={{
          background: T.card, borderRadius: T.radius, padding: 20, marginBottom: 16,
          boxShadow: T.shadow, textAlign: "center",
        }}>
          <div style={{ fontSize: 14, color: T.text, fontWeight: 600, marginBottom: 8 }}>Chưa có project nào</div>
          <div style={{ fontSize: 12, color: T.sub, marginBottom: 16 }}>Tạo 7 projects mặc định (Nexos, OpenArch, Blublok, Yaloka, Saitrai, DongbaoOS, Cá nhân)</div>
          <button onClick={handleSeed} style={{
            padding: "12px 24px", background: T.dark, color: "#fff", border: "none",
            borderRadius: T.radiusSm, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit",
          }}>Tạo projects</button>
        </div>
      )}

      {/* Project list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {projects.map((p) => {
          const isRunning = runningEntry?.projectId === p.id;
          const todaySec = projectTodayMap.get(p.id) || 0;
          return (
            <div key={p.id} style={{
              background: T.card, borderRadius: T.radius, padding: 16,
              boxShadow: T.shadow, display: "flex", alignItems: "center", gap: 14,
              border: isRunning ? `2px solid ${p.color}` : "2px solid transparent",
              transition: "border .2s",
            }}>
              {/* Color dot */}
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: p.color, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 800, color: "#fff",
              }}>{p.name[0]}</div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text, letterSpacing: -0.3 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>
                  Hôm nay: <span style={{ fontWeight: 600, color: isRunning ? T.green : T.text }}>{fmtDuration(todaySec)}</span>
                </div>
              </div>

              {/* Start/Stop button */}
              {isRunning ? (
                <button onClick={handleStop} style={{
                  width: 44, height: 44, borderRadius: 12, border: "none",
                  background: T.red, cursor: "pointer", display: "flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <svg width="14" height="14" viewBox="0 0 14 14"><rect x="2" y="2" width="10" height="10" rx="2" fill="#fff"/></svg>
                </button>
              ) : (
                <button onClick={() => handleStart(p.id)} disabled={!!runningEntry} style={{
                  width: 44, height: 44, borderRadius: 12, border: "none",
                  background: runningEntry ? T.border : p.color, cursor: runningEntry ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  opacity: runningEntry ? 0.4 : 1,
                }}>
                  <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 2L12 7L3 12V2Z" fill="#fff"/></svg>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Today's entries */}
      {entries.filter((e) => e.endAt).length > 0 && (
        <div style={{ background: T.card, borderRadius: T.radius, padding: 16, boxShadow: T.shadow, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Phiên hôm nay</div>
          {entries.filter((e) => e.endAt).reverse().map((e) => (
            <div key={e.id} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
              borderBottom: `1px solid ${T.border}`,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: e.project?.color || T.muted, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{e.project?.name || "—"}</div>
                <div style={{ fontSize: 11, color: T.sub }}>
                  {new Date(e.startAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  {" → "}
                  {e.endAt ? new Date(e.endAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{fmtDuration(e.durationSec)}</div>
              <button onClick={() => handleDelete(e.id)} style={{
                background: "none", border: "none", cursor: "pointer", padding: 4,
                color: T.muted, fontSize: 16, lineHeight: 1,
              }}>×</button>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.3 } }`}</style>
    </div>
  );
}
