"use client";

import { useState, useEffect, useCallback } from "react";
import { T, DAYS, WEEK, TRAINING, fmtDuration } from "@/lib/constants";

interface WeekData {
  week: { from: string; to: string };
  days: Array<{
    date: string;
    dayLabel: string;
    healthPct: number;
    feeling: number;
    note: string;
    projectTimes: { projectId: string; projectName: string; projectColor: string; totalSec: number }[];
    totalSec: number;
  }>;
  weeklyTotalSec: number;
  weeklyProjectTotals: { projectId: string; projectName: string; projectColor: string; totalSec: number }[];
  avgHealthPct: number;
  avgFeeling: number;
}

export function WeekView() {
  const [data, setData] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandDay, setExpandDay] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/weekly-summary");
      const d = await res.json();
      setData(d);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || !data) {
    return <div style={{ padding: 40, textAlign: "center", color: T.sub }}>Đang tải...</div>;
  }

  const now = new Date();
  const dow = now.getDay();
  const todayStr = now.toISOString().slice(0, 10);

  return (
    <div style={{ animation: "slideUp .5s cubic-bezier(.4,0,.2,1)" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, color: T.sub }}>Lịch trình</div>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, color: T.text }}>Tuần này</div>
      </div>

      {/* Week pill bar */}
      <div style={{
        background: T.dark, borderRadius: T.radius, padding: 12, marginBottom: 16,
        display: "flex", gap: 4, boxShadow: T.shadowLg,
      }}>
        {data.days.map((d, i) => {
          const isToday = d.date === todayStr;
          const hasData = d.totalSec > 0 || d.healthPct > 0;
          return (
            <div key={d.date} style={{
              flex: 1, padding: "10px 0", borderRadius: 12,
              background: isToday ? "#333" : "transparent",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            }}>
              <span style={{ fontSize: 9, fontWeight: 600, color: isToday ? "#fff" : "#666", letterSpacing: 0.5 }}>{d.dayLabel}</span>
              <div style={{
                width: 28, height: 28, borderRadius: 14,
                background: hasData ? T.accent : (isToday ? "#444" : "#222"),
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {hasData ? (
                  <span style={{ fontSize: 9, fontWeight: 700, color: T.accentDark }}>{d.healthPct}%</span>
                ) : (
                  <span style={{ fontSize: 9, color: "#555" }}>—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Weekly totals */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1, background: T.card, borderRadius: T.radius, padding: 16, textAlign: "center", boxShadow: T.shadow }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: T.text }}>{fmtDuration(data.weeklyTotalSec).split(" ")[0]}</div>
          <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{fmtDuration(data.weeklyTotalSec).split(" ")[1] || "phút"} tổng thời gian</div>
        </div>
        <div style={{ flex: 1, background: T.card, borderRadius: T.radius, padding: 16, textAlign: "center", boxShadow: T.shadow }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: data.avgHealthPct >= 70 ? T.green : T.text }}>{data.avgHealthPct}%</div>
          <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>TB sức khỏe</div>
        </div>
      </div>

      {/* Project allocation bar */}
      {data.weeklyProjectTotals.length > 0 && (
        <div style={{ background: T.card, borderRadius: T.radius, padding: 16, marginBottom: 16, boxShadow: T.shadow }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Phân bổ thời gian</div>
          {/* Stacked bar */}
          <div style={{ display: "flex", height: 12, borderRadius: 6, overflow: "hidden", marginBottom: 12 }}>
            {data.weeklyProjectTotals
              .filter((p) => p.totalSec > 0)
              .map((p) => (
                <div key={p.projectId} style={{
                  width: `${(p.totalSec / data.weeklyTotalSec) * 100}%`,
                  background: p.projectColor,
                }} />
              ))}
          </div>
          {/* Legend */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {data.weeklyProjectTotals
              .filter((p) => p.totalSec > 0)
              .sort((a, b) => b.totalSec - a.totalSec)
              .map((p) => (
                <div key={p.projectId} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 4, background: p.projectColor, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.text, flex: 1 }}>{p.projectName}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.sub }}>{fmtDuration(p.totalSec)}</span>
                  <span style={{ fontSize: 11, color: T.muted, minWidth: 36, textAlign: "right" }}>
                    {Math.round((p.totalSec / data.weeklyTotalSec) * 100)}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Daily detail */}
      <div style={{ background: T.card, borderRadius: T.radius, marginBottom: 16, boxShadow: T.shadow, padding: 16 }}>
        {data.days.map((d, i) => {
          const isToday = d.date === todayStr;
          const isOpen = expandDay === i;
          const dowNum = DAYS.indexOf(d.dayLabel);
          const trainingInfo = dowNum >= 0 ? TRAINING[dowNum] : null;
          return (
            <div key={d.date}>
              <button onClick={() => setExpandDay(isOpen ? null : i)} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "14px 0",
                width: "100%", background: "none", border: "none", cursor: "pointer",
                borderBottom: i < 6 ? `1px solid ${T.border}` : "none",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 36, flexShrink: 0,
                  background: d.totalSec > 0 || d.healthPct > 0 ? T.green : (isToday ? T.dark : T.border),
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {d.totalSec > 0 || d.healthPct > 0 ? (
                    <svg width="14" height="12" viewBox="0 0 14 12" fill="none"><path d="M1 6L5 10L13 1" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 700, color: isToday ? "#fff" : T.sub }}>{d.dayLabel}</span>
                  )}
                </div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: isToday ? T.text : T.sub, letterSpacing: -0.3 }}>
                    {trainingInfo?.label || d.dayLabel}
                  </div>
                  <div style={{ fontSize: 12, color: T.muted }}>
                    {d.totalSec > 0 ? fmtDuration(d.totalSec) : "—"} {d.healthPct > 0 && `· ${d.healthPct}%`}
                  </div>
                </div>
                {isToday && <div style={{ width: 8, height: 8, borderRadius: 4, background: T.accent }} />}
              </button>
              {isOpen && (
                <div style={{ padding: "10px 0 10px 50px", animation: "fadeIn .2s ease" }}>
                  {d.projectTimes.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
                      {d.projectTimes.map((pt) => (
                        <div key={pt.projectId} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 4, background: pt.projectColor }} />
                          <span style={{ fontSize: 12, color: T.sub }}>{pt.projectName}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: T.text, marginLeft: "auto" }}>{fmtDuration(pt.totalSec)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>Chưa có phiên nào</div>
                  )}
                  {d.feeling > 0 && <div style={{ fontSize: 12, color: T.sub }}>⚡ Năng lượng: {d.feeling}/10</div>}
                  {d.note && <div style={{ fontSize: 12, color: T.sub, fontStyle: "italic", marginTop: 4 }}>📝 {d.note}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
