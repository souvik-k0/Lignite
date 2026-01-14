import { createClient } from "@/lib/supabase/server";
import { db, projects, researchTopics, generatedContent } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

// DELETE - Delete project and all its data
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Delete project (cascades to topics and content)
        await db
            .delete(projects)
            .where(and(eq(projects.id, id), eq(projects.userId, user.id)));

        return NextResponse.json({ message: "Project deleted" });
    } catch (error) {
        console.error("Project delete error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
