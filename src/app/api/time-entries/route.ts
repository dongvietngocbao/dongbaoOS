import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/time-entries?date=YYYY-MM-DD  — entries for a specific day
// GET /api/time-entries?from=YYYY-MM-DD&to=YYYY-MM-DD — range
// GET /api/time-entries?running=true — currently running entry
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const running = searchParams.get("running");

    if (running === "true") {
      const entry = await db.timeEntry.findFirst({
        where: { endAt: null },
        include: { project: true },
      });
      return NextResponse.json({ entry });
    }

    if (date) {
      const entries = await db.timeEntry.findMany({
        where: { date },
        include: { project: true },
        orderBy: { startAt: "asc" },
      });
      return NextResponse.json({ entries });
    }

    if (from && to) {
      const entries = await db.timeEntry.findMany({
        where: { date: { gte: from, lte: to } },
        include: { project: true },
        orderBy: [{ date: "asc" }, { startAt: "asc" }],
      });
      return NextResponse.json({ entries });
    }

    return NextResponse.json({ error: "Provide date, from/to, or running param" }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/time-entries — start timer
// body: { projectId, note? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, projectId, note, entryId } = body;

    // Stop a running timer
    if (action === "stop") {
      if (entryId) {
        const entry = await db.timeEntry.findUnique({ where: { id: entryId } });
        if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });
        if (entry.endAt) return NextResponse.json({ error: "Already stopped" }, { status: 400 });

        const now = new Date();
        const durationSec = Math.floor((now.getTime() - entry.startAt.getTime()) / 1000);
        const updated = await db.timeEntry.update({
          where: { id: entryId },
          data: { endAt: now, durationSec },
        });
        return NextResponse.json({ success: true, entry: updated });
      }

      // Stop any running timer
      const running = await db.timeEntry.findFirst({ where: { endAt: null } });
      if (!running) return NextResponse.json({ error: "No running timer" }, { status: 400 });

      const now = new Date();
      const durationSec = Math.floor((now.getTime() - running.startAt.getTime()) / 1000);
      const updated = await db.timeEntry.update({
        where: { id: running.id },
        data: { endAt: now, durationSec },
      });
      return NextResponse.json({ success: true, entry: updated });
    }

    // Start a new timer (stops any running timer first)
    if (action === "start" || (!action && projectId)) {
      // Stop existing running timer
      const running = await db.timeEntry.findFirst({ where: { endAt: null } });
      if (running) {
        const now = new Date();
        const durationSec = Math.floor((now.getTime() - running.startAt.getTime()) / 1000);
        await db.timeEntry.update({
          where: { id: running.id },
          data: { endAt: now, durationSec },
        });
      }

      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const entry = await db.timeEntry.create({
        data: {
          projectId,
          date: today,
          startAt: now,
          note: note || "",
        },
        include: { project: true },
      });

      return NextResponse.json({ success: true, entry });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/time-entries?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await db.timeEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
