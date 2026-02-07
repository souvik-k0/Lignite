import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { password } = body;

        // ADMIN_PASSWORD must be set in environment variables
        const VALID_PASSWORD = process.env.ADMIN_PASSWORD;

        if (!VALID_PASSWORD) {
            console.error("ADMIN_PASSWORD environment variable is not set");
            return new NextResponse("Server configuration error", { status: 500 });
        }

        if (password !== VALID_PASSWORD) {
            return new NextResponse("Invalid password", { status: 401 });
        }

        const cookieStore = await cookies();

        // Set a secure cookie
        // Note: secure is false to allow HTTP deployments (e.g., Coolify without SSL)
        cookieStore.set("admin_session", "true", {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            path: "/",
            maxAge: 60 * 60 * 24, // 1 day
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
