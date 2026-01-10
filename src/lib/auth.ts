import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { authConfig } from "./auth.config";

// Full auth with database access - only for API routes and server components
export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const email = credentials.email as string;
                const password = credentials.password as string;

                // Find user by email
                const user = await db.query.users.findFirst({
                    where: eq(users.email, email),
                });

                if (!user) {
                    return null;
                }

                // Verify password
                const isValidPassword = await compare(password, user.password);
                if (!isValidPassword) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                };
            },
        }),
    ],
});
