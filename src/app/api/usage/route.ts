import { createClient } from "@/lib/supabase/server";
import { getUsageStats } from "@/lib/rateLimit";
import { NextResponse } from "next/server";

// GET - Get user's current usage stats
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const stats = await getUsageStats(user.id);

        return NextResponse.json(stats);
    } catch (error) {
        console.error("Usage stats error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
