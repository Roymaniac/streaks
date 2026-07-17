import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

const inviteSchema = z.object({ email: z.string().email() });

// GET /api/partnerships — all partnerships involving the current user
// (both directions, any status)
export async function GET() {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const partnerships = await prisma.partnership.findMany({
        where: { OR: [{ requesterId: userId }, { recipientId: userId }] },
        include: {
            requester: { select: { id: true, name: true, email: true, avatarUrl: true } },
            recipient: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(partnerships);
}

// POST /api/partnerships — invite a partner by email
export async function POST(request: Request) {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const recipient = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!recipient) {
        return NextResponse.json({ error: "No user found with that email" }, { status: 404 });
    }
    if (recipient.id === userId) {
        return NextResponse.json({ error: "You can't invite yourself" }, { status: 400 });
    }

    // block duplicates in EITHER direction — schema only enforces one direction,
    // so check the reverse pair here in application code
    const existing = await prisma.partnership.findFirst({
        where: {
            OR: [
                { requesterId: userId, recipientId: recipient.id },
                { requesterId: recipient.id, recipientId: userId },
            ],
        },
    });
    if (existing) {
        return NextResponse.json(
            { error: "A partnership with this person already exists" },
            { status: 400 }
        );
    }

    const partnership = await prisma.partnership.create({
        data: { requesterId: userId, recipientId: recipient.id, status: "PENDING" },
    });

    return NextResponse.json(partnership, { status: 201 });
}