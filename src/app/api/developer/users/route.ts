import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { cookies } from "next/headers";

export async function GET(req: Request) {
    try {
        // Protect Admin Route
        const cookieStore = await cookies();
        const adminSession = cookieStore.get("admin_session");
        if (!adminSession) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const allUsers = await db
            .select()
            .from(users)
            .orderBy(desc(users.createdAt));

        return NextResponse.json(allUsers);
    } catch (error) {
        console.error("Failed to fetch users:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
