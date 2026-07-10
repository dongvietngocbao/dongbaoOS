import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/projects — list all projects (not archived)
export async function GET() {
  try {
    const projects = await db.project.findMany({
      where: { archived: false },
      orderBy: { sortOrder: "asc" },
      include: {
        timeEntries: {
          where: { endAt: { not: null } },
          select: { durationSec: true, date: true },
        },
      },
    });

    // Compute total seconds per project
    const withTotals = projects.map((p) => {
      const totalSec = p.timeEntries.reduce((sum, e) => sum + e.durationSec, 0);
      const { timeEntries, ...rest } = p;
      return { ...rest, totalSec };
    });

    return NextResponse.json({ projects: withTotals });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/projects — create or seed
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, projects } = body;

    // Seed default projects
    if (action === "seed") {
      const defaults = [
        { name: "Nexos", slug: "nexos", color: "#2196F3", description: "Trust infrastructure cho xây dựng", sortOrder: 1 },
        { name: "OpenArch", slug: "openarch", color: "#4ECDC4", description: "Dev-Team-as-a-Service", sortOrder: 2 },
        { name: "Blublok", slug: "blublok", color: "#FFD700", description: "FICO cho công nhân xây dựng", sortOrder: 3 },
        { name: "Yaloka", slug: "yaloka", color: "#FF6B35", description: "Location intelligence, field pipeline", sortOrder: 4 },
        { name: "Saitrai", slug: "saitrai", color: "#AB47BC", description: "F&B → data moat", sortOrder: 5 },
        { name: "DongbaoOS", slug: "dongbaoos", color: "#34C759", description: "30-year health OS", sortOrder: 6 },
        { name: "Cá nhân", slug: "personal", color: "#8E8E93", description: "Cá nhân — đọc, học, family", sortOrder: 7 },
      ];

      const created = [];
      for (const d of defaults) {
        const existing = await db.project.findUnique({ where: { slug: d.slug } });
        if (!existing) {
          const p = await db.project.create({ data: d });
          created.push(p);
        }
      }

      return NextResponse.json({ success: true, created: created.length, message: `Seeded ${created.length} new projects` });
    }

    // Create single project
    const { name, slug, color, description } = body;
    if (!name || !slug) {
      return NextResponse.json({ error: "name and slug required" }, { status: 400 });
    }

    const project = await db.project.create({
      data: { name, slug, color: color || "#1A1A1A", description: description || "" },
    });

    return NextResponse.json({ success: true, project });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PUT /api/projects — update
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const project = await db.project.update({ where: { id }, data });
    return NextResponse.json({ success: true, project });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/projects?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await db.project.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
