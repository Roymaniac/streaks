import type { NextAuthOptions } from "next-auth";
// import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
    // adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: "Email and password",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "Enter a valid email address" },
                password: { label: "Password", type: "password", placeholder: "Enter an 8 digit password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials.password) return null;

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user || !user.hashedPassword) return null;

                const comparePassword = await bcrypt.compare(
                    credentials.password,
                    user.hashedPassword
                );

                if (!comparePassword) return null;

                return { id: user.id, email: user.email, name: user.name };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) token.sub = user.id;
            return token;
        },

        async session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
            }
            return session;
        }
    }
}
