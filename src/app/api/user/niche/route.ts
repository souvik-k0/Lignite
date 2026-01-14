import { createClient } from "@/lib/supabase/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { niche } = await req.json();
        if (!niche?.trim()) {
            return NextResponse.json({ error: "Niche is required" }, { status: 400 });
        }

        await db
            .update(users)
            .set({ niche, updatedAt: new Date() })
            .where(eq(users.id, user.id));

        return NextResponse.json({ message: "Niche updated" });
    } catch (error) {
        console.error("Niche update error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
