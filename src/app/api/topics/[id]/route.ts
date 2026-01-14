import { createClient } from "@/lib/supabase/server";
import { db, researchTopics, generatedContent, projects } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { generateLinkedInPost } from "@/lib/gemini";
import { canGenerate, incrementGenerate } from "@/lib/rateLimit";

// PATCH - Update topic status
export async function PATCH(
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
        const { status, generateContent: shouldGenerate } = await req.json();

        // Get topic
        const topic = await db.query.researchTopics.findFirst({
            where: and(
                eq(researchTopics.id, id),
                eq(researchTopics.userId, user.id)
            ),
        });

        if (!topic) {
            return NextResponse.json({ error: "Topic not found" }, { status: 404 });
        }

        // Check rate limit before generating content
        if (shouldGenerate && status === "APPROVED") {
            const { allowed, limit } = await canGenerate(user.id);
            if (!allowed) {
                return NextResponse.json({
                    error: "Rate limit exceeded",
                    message: `You've reached your daily limit of ${limit} content generations. Resets at midnight.`,
                }, { status: 429 });
            }
        }

        // Update status
        await db
            .update(researchTopics)
            .set({ status, updatedAt: new Date() })
            .where(eq(researchTopics.id, id));

        // Generate content if requested
        if (shouldGenerate && status === "APPROVED") {
            // Get project name for context
            const project = await db.query.projects.findFirst({
                where: eq(projects.id, topic.projectId),
            });

            const content = await generateLinkedInPost(topic.topic, project?.name || "general", user.id);

            // Increment usage count after successful API call
            await incrementGenerate(user.id);

            await db.insert(generatedContent).values({
                title: topic.topic,
                content: content,
                topicId: id,
                projectId: topic.projectId,
                userId: user.id,
            });

            await db
                .update(researchTopics)
                .set({ status: "GENERATED" })
                .where(eq(researchTopics.id, id));
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Topic update error:", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}

// DELETE - Delete topic
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

        await db
            .delete(researchTopics)
            .where(and(eq(researchTopics.id, id), eq(researchTopics.userId, user.id)));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Topic delete error:", error);
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
