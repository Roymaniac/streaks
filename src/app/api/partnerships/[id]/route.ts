import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import type { RouteContext } from "@/types/api";

const respondSchema = z.object({ status: z.enum(["ACCEPTED", "DECLINED"]) });

// PATCH /api/partnerships/[id] — only the recipient can accept/decline
export async function PATCH(
    request: Request,
    context: RouteContext
) {
    const { id } = await context.params;

    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const partnership = await prisma.partnership.findUnique({ where: { id } });
    if (!partnership) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (partnership.recipientId !== userId) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (partnership.status !== "PENDING") {
        return NextResponse.json({ error: "Already responded" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = respondSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const updated = await prisma.partnership.update({
        where: { id },
        data: { status: parsed.data.status, respondedAt: new Date() },
    });

    return NextResponse.json(updated);
}