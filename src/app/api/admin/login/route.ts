import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { password } = body;

        // In a real app, use an env variable. For now, hardcode or fallback.
        // User can set ADMIN_PASSWORD in .env later.
        const VALID_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

        if (password !== VALID_PASSWORD) {
            return new NextResponse("Invalid password", { status: 401 });
        }

        const cookieStore = await cookies();

        // Set a secure cookie
        cookieStore.set("admin_session", "true", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 60 * 60 * 24, // 1 day
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
