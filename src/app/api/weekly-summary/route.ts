import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/weekly-summary?date=YYYY-MM-DD (defaults to today)
// Returns: daily logs + time entries for the week (Mon-Sun)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date") || new Date().toISOString().slice(0, 10);

    const refDate = new Date(dateStr);
    const dayOfWeek = refDate.getDay(); // 0=Sun, 1=Mon...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(refDate);
    monday.setDate(refDate.getDate() + mondayOffset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const fromStr = monday.toISOString().slice(0, 10);
    const toStr = sunday.toISOString().slice(0, 10);

    // Get all daily logs for the week
    const dailyLogs = await db.dailyLog.findMany({
      where: { date: { gte: fromStr, lte: toStr } },
    });

    // Get all time entries for the week
    const timeEntries = await db.timeEntry.findMany({
      where: {
        date: { gte: fromStr, lte: toStr },
        endAt: { not: null },
      },
      include: { project: true },
    });

    // Build per-day summary
    const days: Array<{
      date: string;
      dayLabel: string;
      healthPct: number;
      feeling: number;
      note: string;
      projectTimes: { projectId: string; projectName: string; projectColor: string; totalSec: number }[];
      totalSec: number;
    }> = [];

    const dayLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dStr = d.toISOString().slice(0, 10);

      const log = dailyLogs.find((l) => l.date === dStr);
      const entries = timeEntries.filter((e) => e.date === dStr);

      // Aggregate time per project
      const projectMap = new Map<string, { projectName: string; projectColor: string; totalSec: number }>();
      for (const e of entries) {
        const existing = projectMap.get(e.projectId) || { projectName: e.project.name, projectColor: e.project.color, totalSec: 0 };
        existing.totalSec += e.durationSec;
        projectMap.set(e.projectId, existing);
      }

      days.push({
        date: dStr,
        dayLabel: dayLabels[d.getDay()],
        healthPct: log?.pct || 0,
        feeling: log?.feeling || 0,
        note: log?.noteText || "",
        projectTimes: Array.from(projectMap.entries()).map(([projectId, v]) => ({ projectId, ...v })),
        totalSec: entries.reduce((sum, e) => sum + e.durationSec, 0),
      });
    }

    // Weekly totals
    const weeklyTotalSec = days.reduce((sum, d) => sum + d.totalSec, 0);
    const weeklyProjectTotals = new Map<string, { projectName: string; projectColor: string; totalSec: number }>();
    for (const d of days) {
      for (const pt of d.projectTimes) {
        const existing = weeklyProjectTotals.get(pt.projectId) || { projectName: pt.projectName, projectColor: pt.projectColor, totalSec: 0 };
        existing.totalSec += pt.totalSec;
        weeklyProjectTotals.set(pt.projectId, existing);
      }
    }

    const avgHealthPct = Math.round(days.reduce((s, d) => s + d.healthPct, 0) / 7);
    const avgFeeling = Math.round(days.reduce((s, d) => s + d.feeling, 0) / (days.filter(d => d.feeling > 0).length || 1));

    return NextResponse.json({
      week: { from: fromStr, to: toStr },
      days,
      weeklyTotalSec,
      weeklyProjectTotals: Array.from(weeklyProjectTotals.entries()).map(([projectId, v]) => ({ projectId, ...v })),
      avgHealthPct,
      avgFeeling,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
