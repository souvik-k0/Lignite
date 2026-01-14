import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session");

    if (!adminSession) {
        redirect("/admin/login");
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {children}
        </div>
    );
}
