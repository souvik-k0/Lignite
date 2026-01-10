import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { db, projects } from "@/lib/db";
import { eq } from "drizzle-orm";

export default async function DashboardLayout({
    children,
    searchParams,
}: {
    children: React.ReactNode;
    searchParams?: Promise<{ project?: string }>;
}) {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    // Get user's projects
    const userProjects = await db.query.projects.findMany({
        where: eq(projects.userId, session.user.id),
        orderBy: (p, { desc }) => [desc(p.createdAt)],
    });

    const params = await searchParams;
    const activeProjectId = params?.project;

    return (
        <div className="h-screen w-screen flex bg-linkedin-page-bg font-sans text-gray-900">
            <Sidebar
                user={session.user}
                projects={userProjects}
                activeProjectId={activeProjectId}
            />
            <main className="flex-1 relative overflow-hidden">{children}</main>
        </div>
    );
}
