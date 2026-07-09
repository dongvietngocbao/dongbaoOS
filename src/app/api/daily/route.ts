import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appendDailyToSheet } from "@/lib/google-sheets";

// POST /api/daily - Save or update daily log
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, checks, weekDone, feeling, noteText, layer, pct, syncToSheet } = body;

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    // Upsert daily log
    const log = await db.dailyLog.upsert({
      where: { date },
      update: {
        checks: JSON.stringify(checks || {}),
        weekDone: JSON.stringify(weekDone || {}),
        feeling: feeling || 0,
        noteText: noteText || "",
        layer: layer || 1,
        pct: pct || 0,
      },
      create: {
        date,
        checks: JSON.stringify(checks || {}),
        weekDone: JSON.stringify(weekDone || {}),
        feeling: feeling || 0,
        noteText: noteText || "",
        layer: layer || 1,
        pct: pct || 0,
      },
    });

    // Sync to Google Sheets if requested
    let sheetResult = null;
    if (syncToSheet) {
      const allChecks = checks || {};
      const trainingChecks = Object.entries(allChecks).filter(([k]) => k.startsWith("t_"));
      const nutritionChecks = Object.entries(allChecks).filter(([k]) => k.startsWith("n_"));
      const mindChecks = Object.entries(allChecks).filter(([k]) => k.startsWith("m_"));
      const sleepChecks = Object.entries(allChecks).filter(([k]) => k.startsWith("s_"));

      const fmt = (arr: [string, unknown][]) => `${arr.filter(([, v]) => v).length}/${arr.length}`;

      sheetResult = await appendDailyToSheet({
        date,
        training: fmt(trainingChecks),
        nutrition: fmt(nutritionChecks),
        mind: fmt(mindChecks),
        sleep: fmt(sleepChecks),
        totalPct: pct || 0,
        feeling: feeling || 0,
        note: noteText || "",
        layer: layer || 1,
      });
    }

    return NextResponse.json({ success: true, log, sheetResult });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET /api/daily?date=YYYY-MM-DD - Get daily log
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "Date query param required" }, { status: 400 });
  }

  const log = await db.dailyLog.findUnique({ where: { date } });
  if (!log) {
    return NextResponse.json({ date, checks: {}, weekDone: {}, feeling: 0, noteText: "", layer: 1, pct: 0 });
  }

  return NextResponse.json({
    ...log,
    checks: JSON.parse(log.checks),
    weekDone: JSON.parse(log.weekDone),
  });
}