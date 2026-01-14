import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { db, projects } from "@/lib/db";
import { eq } from "drizzle-orm";
import FeedbackDialog from "@/components/FeedbackDialog";

export default async function DashboardLayout({
    children,
    searchParams,
}: {
    children: React.ReactNode;
    searchParams?: Promise<{ project?: string }>;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Get user's projects
    const userProjects = await db.query.projects.findMany({
        where: eq(projects.userId, user.id),
        orderBy: (p, { desc }) => [desc(p.createdAt)],
    });

    const params = await searchParams;
    const activeProjectId = params?.project;

    return (
        <div className="h-screen w-screen flex bg-linkedin-page-bg font-sans text-gray-900">
            <Sidebar
                user={{ name: user.user_metadata?.name, email: user.email }}
                projects={userProjects}
                activeProjectId={activeProjectId}
            />
            <main className="flex-1 relative overflow-hidden">{children}</main>
            <FeedbackDialog />
        </div>
    );
}
