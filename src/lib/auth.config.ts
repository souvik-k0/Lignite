import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// Edge-compatible auth config - NO database imports
export const authConfig: NextAuthConfig = {
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            // Authorize is handled in auth.ts
            authorize: async () => null,
        }),
    ],
    session: {
        strategy: "jwt",
    },
    secret: process.env.AUTH_SECRET,
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request }) {
            const isLoggedIn = !!auth?.user;
            const pathname = request.nextUrl.pathname;
            const isOnDashboard = pathname.startsWith("/dashboard");
            const isOnAuth = pathname.startsWith("/login") || pathname.startsWith("/register");

            if (isOnDashboard) {
                return isLoggedIn;
            }

            if (isOnAuth && isLoggedIn) {
                return Response.redirect(new URL("/dashboard", request.nextUrl.origin));
            }

            return true;
        },
        jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
};
