import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { systemLogs, users } from "@/lib/db/schema";
import { Logger } from "@/lib/logger";
import { desc, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(req: Request) {
    try {
        // Protect Admin Route
        const cookieStore = await cookies();
        const adminSession = cookieStore.get("admin_session");
        if (!adminSession) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const grouped = searchParams.get("grouped") === "true";

        // Fetch logs with user info
        const logs = await db
            .select({
                id: systemLogs.id,
                level: systemLogs.level,
                action: systemLogs.action,
                message: systemLogs.message,
                details: systemLogs.details,
                userId: systemLogs.userId,
                createdAt: systemLogs.createdAt,
                user: {
                    name: users.name,
                    email: users.email,
                }
            })
            .from(systemLogs)
            .leftJoin(users, eq(systemLogs.userId, users.id))
            .orderBy(desc(systemLogs.createdAt))
            .limit(200);

        if (!grouped) {
            return NextResponse.json(logs);
        }

        // Group logs by user
        const userMap = new Map<string, any>();

        for (const log of logs) {
            const key = log.userId || "anonymous";

            if (!userMap.has(key)) {
                userMap.set(key, {
                    userId: log.userId,
                    user: log.user,
                    activities: [],
                    firstSeen: log.createdAt,
                    lastSeen: log.createdAt,
                });
            }

            const userData = userMap.get(key);
            userData.activities.push({
                id: log.id,
                level: log.level,
                action: log.action,
                message: log.message,
                details: log.details,
                createdAt: log.createdAt,
            });
            userData.lastSeen = log.createdAt;
        }

        return NextResponse.json(Array.from(userMap.values()));
    } catch (error) {
        console.error("Failed to fetch logs:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const body = await req.json();
        const { level, action, message, details } = body;

        // Use our Logger utility which handles the DB insert
        await Logger.log(
            level || "INFO",
            action || "CLIENT_EVENT",
            message || "No message",
            details,
            user?.id
        );

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

        // Clear all logs or specific one
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (id) {
            await db.delete(systemLogs).where(eq(systemLogs.id, id));
        } else {
            // Dangerous: Clear all
            await db.delete(systemLogs);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
