import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Skip check for login page itself (handled by middleware or structure, but here specifically)
    // Actually, this layout wraps /admin/dashboard, so check here.

    // We need to be careful. Next.js nested layouts. 
    // If this file is in src/app/admin/layout.tsx, it wraps BOTH /admin/login AND /admin/dashboard.
    // We don't want to redirect from login to login.

    // Better approach: specific layout for dashboard only?
    // OR: Check if we are on login page? Layout doesn't know path easily without headers.

    // Simplest: Checks cookie. If missing, redirect to login.
    // BUT we must allow access to /admin/login.

    // We will place this layout in src/app/admin/dashboard/layout.tsx instead!

    return (
        <div className="min-h-screen bg-gray-50">
            {children}
        </div>
    );
}
