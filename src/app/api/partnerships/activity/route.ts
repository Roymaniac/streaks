import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { calculateStreak } from "@/lib/streaks";

// GET /api/partnerships/activity — each accepted partner's habits + streaks,
// plus whether *this* user can still nudge them today (cooldown check),
// so the dashboard doesn't need a second round trip to figure that out.
export async function GET() {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const partnerships = await prisma.partnership.findMany({
        where: {
            status: "ACCEPTED",
            OR: [{ requesterId: userId }, { recipientId: userId }],
        },
        include: {
            requester: { select: { id: true, name: true, email: true } },
            recipient: { select: { id: true, name: true, email: true } },
        },
    });

    const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000);

    const activity = await Promise.all(
        partnerships.map(async (p) => {
            const partner = p.requesterId === userId ? p.recipient : p.requester;

            const habits = await prisma.habit.findMany({
                where: { userId: partner.id, archived: false },
                include: { logs: { select: { date: true } } },
            });

            const topHabit = habits
                .map((h) => ({
                    title: h.title,
                    ...calculateStreak(h.logs.map((l) => l.date), h.frequency),
                }))
                .sort((a, b) => b.currentStreak - a.currentStreak)[0];

            const recentNudge = await prisma.nudge.findFirst({
                where: { partnershipId: p.id, senderId: userId, createdAt: { gte: cutoff } },
            });

            return {
                partnershipId: p.id,
                partner: { id: partner.id, name: partner.name, email: partner.email },
                topHabit: topHabit ?? null,
                canNudge: !recentNudge,
            };
        })
    );

    return NextResponse.json(activity);
}