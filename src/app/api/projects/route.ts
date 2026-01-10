import { auth } from "@/lib/auth";
import { db, projects } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET - List all projects for user
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userProjects = await db.query.projects.findMany({
            where: eq(projects.userId, session.user.id),
            orderBy: (p, { desc }) => [desc(p.createdAt)],
        });

        return NextResponse.json(userProjects);
    } catch (error) {
        console.error("Projects list error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Create new project
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name } = await req.json();
        if (!name?.trim()) {
            return NextResponse.json({ error: "Project name is required" }, { status: 400 });
        }

        const [newProject] = await db
            .insert(projects)
            .values({
                name: name.trim(),
                userId: session.user.id,
            })
            .returning();

        return NextResponse.json(newProject, { status: 201 });
    } catch (error) {
        console.error("Project create error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
