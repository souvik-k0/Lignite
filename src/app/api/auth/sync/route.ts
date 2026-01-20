import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { Logger } from "@/lib/logger";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const fullName = user.user_metadata?.name || user.user_metadata?.full_name || user.email.split("@")[0];

        // Upsert user into public.users table
        await db
            .insert(users)
            .values({
                id: user.id,
                email: user.email,
                name: fullName,
                updatedAt: new Date(),
            })
            .onConflictDoUpdate({
                target: users.id,
                set: {
                    email: user.email,
                    name: fullName,
                    updatedAt: new Date(),
                },
            });

        // Log the sign-in event
        await Logger.info("AUTH_EVENT", "User Signed In", {
            email: user.email,
            name: fullName,
        }, user.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Auth sync error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
