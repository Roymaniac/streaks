import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

const nudgeSchema = z.object({
    partnershipId: z.string(),
    message: z.string().max(200).optional(),
});

const NUDGE_COOLDOWN_HOURS = 12;

// POST /api/nudges — send a nudge to an accepted partner
export async function POST(request: Request) {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = nudgeSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const partnership = await prisma.partnership.findUnique({
        where: { id: parsed.data.partnershipId },
    });
    if (!partnership || partnership.status !== "ACCEPTED") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (partnership.requesterId !== userId && partnership.recipientId !== userId) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const recipientId =
        partnership.requesterId === userId ? partnership.recipientId : partnership.requesterId;

    // rate-limit: one nudge per partnership per cooldown window, so this
    // stays a light "hey, keep it up" rather than something spammable
    const cutoff = new Date(Date.now() - NUDGE_COOLDOWN_HOURS * 60 * 60 * 1000);
    const recentNudge = await prisma.nudge.findFirst({
        where: { partnershipId: partnership.id, senderId: userId, createdAt: { gte: cutoff } },
    });
    if (recentNudge) {
        return NextResponse.json(
            { error: `You can nudge this partner again in a bit — one nudge per ${NUDGE_COOLDOWN_HOURS}h` },
            { status: 429 }
        );
    }

    const nudge = await prisma.nudge.create({
        data: {
            partnershipId: partnership.id,
            senderId: userId,
            recipientId,
            message: parsed.data.message,
        },
    });

    // Fire off a notification email here (Resend, Postmark, etc.) if you've
    // wired one up — kept out of scope for the portfolio build itself.

    return NextResponse.json(nudge, { status: 201 });
}