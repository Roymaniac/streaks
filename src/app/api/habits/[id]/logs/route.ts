import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { calculateStreak } from "@/lib/streaks";
import type { RouteContext } from "@/types/api";


export async function POST(
    _request: Request,
    context: RouteContext
) {
    const { id } = await context.params;

    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const habit = await prisma.habit.findUnique({ where: { id } });
    if (!habit || habit.userId !== userId) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // normalize to midnight local so the unique(habitId, date) constraint
    // matches regardless of what time of day the check-off happens
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.habitLog.findUnique({
        where: { habitId_date: { habitId: habit.id, date: today } },
    });

    if (existing) {
        await prisma.habitLog.delete({ where: { id: existing.id } });
    } else {
        await prisma.habitLog.create({
            data: { habitId: habit.id, date: today, completed: true },
        });
    }

    const logs = await prisma.habitLog.findMany({
        where: { habitId: habit.id },
        select: { date: true },
    });
    const streaks = calculateStreak(
        logs.map((l) => l.date),
        habit.frequency
    );

    return NextResponse.json({
        completed: !existing,
        ...streaks,
    });
}