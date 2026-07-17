import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { calculateStreak } from "@/lib/streaks";


const createHabitSchema = z.object({
    title: z.string().min(1).max(100),
    frequency: z.enum(["DAILY", "WEEKLY"]).default("DAILY"),
    color: z.string().default("teal"),
    icon: z.string().default("ti-check")
})

// GET ENDPOINT
export async function GET() {
    const userId = await getCurrentUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const habits = await prisma.habit.findMany({
        where: { userId, archived: false },
        include: {
            logs: { select: { date: true }, orderBy: { date: "desc" } },
        },
        orderBy: { createdAt: "asc" },
    });

    const todayKey = new Date().toDateString();

    const withStreaks = habits.map((habit) => {
        const { currentStreak, longestStreak } = calculateStreak(
            habit.logs.map((l) => l.date),
            habit.frequency
        );
        const completedToday = habit.logs.some(
            (l) => l.date.toDateString() === todayKey
        );

        // don't leak the full log list to the list view — detail page fetches
        // its own logs when the user actually opens a habit
        const { logs, ...rest } = habit;
        return { ...rest, currentStreak, longestStreak, completedToday };
    });


    return NextResponse.json(withStreaks);
}

// POST ENDPOINT

export async function POST(request: Request) {
    const userId = await getCurrentUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createHabitSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0].message },
            { status: 400 }
        );
    }

    const habit = await prisma.habit.create({
        data: { ...parsed.data, userId },
    });

    return NextResponse.json(habit, { status: 201 });
}