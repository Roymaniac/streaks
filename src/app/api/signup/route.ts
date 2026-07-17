import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    name: z.string().min(1).optional(),
});

export async function POST(request: Request) {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0].message },
            { status: 400 }
        );
    }

    const { email, password, name } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        // deliberately generic message — don't confirm/deny which emails exist
        return NextResponse.json(
            { error: "Could not create account with those details" },
            { status: 400 }
        );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
        data: { email, name, hashedPassword },
        select: { id: true, email: true, name: true },
    });

    return NextResponse.json(user, { status: 201 });
}