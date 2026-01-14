import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { feedback, users } from "@/lib/db/schema";
import { Logger } from "@/lib/logger";
import { desc, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const body = await req.json();
        const { type, message } = body;

        if (!message) return new NextResponse("Message required", { status: 400 });

        await db.insert(feedback).values({
            type,
            message,
            status: "OPEN",
            userId: user?.id || null // Capture User ID
        });

        // Log this event too
        await Logger.info("FEEDBACK_SUBMIT", `New ${type} submitted`, { type }, user?.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        Logger.error("SYSTEM_ERROR", "Feedback submission failed", { error });
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        // Protect Admin Route
        const cookieStore = await cookies();
        const adminSession = cookieStore.get("admin_session");
        if (!adminSession) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const items = await db
            .select({
                id: feedback.id,
                type: feedback.type,
                message: feedback.message,
                status: feedback.status,
                createdAt: feedback.createdAt,
                user: {
                    name: users.name,
                    email: users.email,
                }
            })
            .from(feedback)
            .leftJoin(users, eq(feedback.userId, users.id))
            .orderBy(desc(feedback.createdAt))
            .limit(50);

        return NextResponse.json(items);
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        // Protect Admin Route
        const cookieStore = await cookies();
        const adminSession = cookieStore.get("admin_session");
        if (!adminSession) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { id, status } = body;

        await db.update(feedback)
            .set({ status })
            .where(eq(feedback.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        // Protect Admin Route
        const cookieStore = await cookies();
        const adminSession = cookieStore.get("admin_session");
        if (!adminSession) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return new NextResponse("ID required", { status: 400 });

        await db.delete(feedback).where(eq(feedback.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
