import { auth } from "@/lib/auth";
import { db, researchTopics, projects } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { researchTrendingTopics } from "@/lib/gemini";
import { canResearch, incrementResearch } from "@/lib/rateLimit";

// GET - List topics for a project
export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get("project");

        if (!projectId) {
            return NextResponse.json({ error: "Project ID required" }, { status: 400 });
        }

        const topics = await db.query.researchTopics.findMany({
            where: and(
                eq(researchTopics.projectId, projectId),
                eq(researchTopics.userId, session.user.id)
            ),
            orderBy: (t, { desc }) => [desc(t.createdAt)],
        });

        return NextResponse.json(topics);
    } catch (error) {
        console.error("Topics list error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Research new topics for a project
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check rate limit
        const { allowed, remaining, limit } = await canResearch(session.user.id);
        if (!allowed) {
            return NextResponse.json({
                error: "Rate limit exceeded",
                message: `You've reached your daily limit of ${limit} research requests. Resets at midnight.`,
                remaining: 0,
                limit,
            }, { status: 429 });
        }

        const { projectId } = await req.json();

        if (!projectId) {
            return NextResponse.json({ error: "Project ID required" }, { status: 400 });
        }

        // Get project name (used as niche for research)
        const project = await db.query.projects.findFirst({
            where: and(eq(projects.id, projectId), eq(projects.userId, session.user.id)),
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Research trending topics using Gemini
        const topics = await researchTrendingTopics(project.name);

        // Increment usage count after successful API call
        await incrementResearch(session.user.id);

        // Handle case where no topics were found
        if (topics.length === 0) {
            return NextResponse.json({ message: "No topics found. Please try again." }, { status: 200 });
        }

        // Insert new topics
        const inserted = await db
            .insert(researchTopics)
            .values(
                topics.map((t) => ({
                    topic: t.topic,
                    sourceUrl: t.sourceUrl,
                    sourceTitle: t.sourceTitle,
                    projectId: projectId,
                    userId: session.user.id,
                }))
            )
            .returning();

        return NextResponse.json(inserted);
    } catch (error) {
        console.error("Research error:", error);
        return NextResponse.json({ error: "Research failed" }, { status: 500 });
    }
}
