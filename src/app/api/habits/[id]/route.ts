import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { calculateStreak } from "@/lib/streaks";
import type { RouteContext } from "@/types/api";

const updateHabitSchema = z.object({
    title: z.string().min(1).max(100).optional(),
    color: z.string().optional(),
    icon: z.string().optional(),
    archived: z.boolean().optional(),
});

/** Loads the habit and confirms it belongs to the current user, or throws a 404/403 response. */
async function loadOwnedHabit(habitId: string, userId: string) {
    const habit = await prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
    if (habit.userId !== userId) {
        // 404 rather than 403 — don't reveal that a habit id exists at all
        return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
    }
    return { habit };
}

// GET /api/habits/[id] — full detail including logs, for the heatmap
export async function GET(
    _request: Request,
    context: RouteContext
) {
    const { id } = await context.params

    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { habit, error } = await loadOwnedHabit(id, userId);
    if (error) return error;

    const logs = await prisma.habitLog.findMany({
        where: { habitId: habit!.id },
        orderBy: { date: "asc" },
    });

    const { currentStreak, longestStreak } = calculateStreak(
        logs.map((l) => l.date),
        habit!.frequency
    );

    return NextResponse.json({ ...habit, logs, currentStreak, longestStreak });
}

// PATCH /api/habits/[id] — edit title/color/icon, or archive
export async function PATCH(
    request: Request,
    context: RouteContext
) {
    const { id } = await context.params;

    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await loadOwnedHabit(id, userId);
    if (error) return error;

    const body = await request.json();
    const parsed = updateHabitSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const updated = await prisma.habit.update({
        where: { id },
        data: parsed.data,
    });

    return NextResponse.json(updated);
}

// DELETE /api/habits/[id]
export async function DELETE(
    _request: Request,
    context: RouteContext
) {
    const { id } = await context.params;

    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await loadOwnedHabit(id, userId);
    if (error) return error;

    await prisma.habit.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
}