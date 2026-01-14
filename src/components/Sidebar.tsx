"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    Folder,
    FileSpreadsheet,
    FileText,
    Plus,
    LayoutGrid,
    LogOut,
    Trash2,
    X,
    Loader2,
} from "lucide-react";

interface Project {
    id: string;
    name: string;
}

interface SidebarProps {
    user: {
        name?: string | null;
        email?: string | null;
    };
    projects: Project[];
    activeProjectId?: string | null;
}

export default function Sidebar({ user, projects: initialProjects, activeProjectId }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>(initialProjects);
    const [isOpen, setIsOpen] = useState(false);
    const [showNewProject, setShowNewProject] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    const isActive = (path: string) => pathname === path;

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;

        setIsCreating(true);
        try {
            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newProjectName }),
            });

            if (res.ok) {
                const newProject = await res.json();
                setProjects([newProject, ...projects]);
                setNewProjectName("");
                setShowNewProject(false);
                router.refresh();
            }
        } catch (error) {
            console.error("Failed to create project:", error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteProject = async (id: string) => {
        try {
            await fetch(`/api/projects/${id}`, { method: "DELETE" });
            setProjects(projects.filter((p) => p.id !== id));
            setDeleteConfirmId(null);
            router.refresh();
        } catch (error) {
            console.error("Failed to delete project:", error);
        }
    };

    return (
        <>
            {/* Mobile Menu Button - Fixed to top left when sidebar is closed */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md text-gray-700 hover:bg-gray-50 border border-gray-200"
                aria-label="Toggle menu"
            >
                {isOpen ? <X size={20} /> : <div className="space-y-1">
                    <div className="w-5 h-0.5 bg-gray-600"></div>
                    <div className="w-5 h-0.5 bg-gray-600"></div>
                    <div className="w-5 h-0.5 bg-gray-600"></div>
                </div>}
            </button>

            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={`
                    fixed inset-y-0 left-0 z-40 w-64 bg-linkedin-sidebar border-r border-linkedin-gray-light h-full flex flex-col transition-transform duration-300 ease-in-out
                    md:translate-x-0 md:static md:h-full md:inset-auto
                    ${isOpen ? "translate-x-0" : "-translate-x-full"}
                `}
            >
                {/* Logo */}
                <div className="p-4 border-b border-linkedin-gray-light flex items-center gap-2 pl-16 md:pl-4">
                    <div className="w-8 h-8 bg-linkedin rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        Li
                    </div>
                    <span className="font-semibold text-linkedin-charcoal">Lignite</span>
                </div>

                {/* New Button */}
                <div className="p-4">
                    <button
                        onClick={() => setShowNewProject(true)}
                        className="w-full bg-linkedin text-white rounded-full py-2.5 px-4 shadow-sm font-medium hover:bg-linkedin-dark flex items-center justify-center gap-2 transition-colors"
                    >
                        <Plus size={18} />
                        <span>New Project</span>
                    </button>
                </div>

                {/* New Project Modal */}
                {showNewProject && (
                    <div className="px-4 pb-4">
                        <form onSubmit={handleCreateProject} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">New Project</span>
                                <button
                                    type="button"
                                    onClick={() => setShowNewProject(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <input
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="e.g. SaaS Marketing"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-linkedin"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={isCreating || !newProjectName.trim()}
                                className="w-full py-2 bg-linkedin text-white rounded-lg text-sm font-medium hover:bg-linkedin-dark disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isCreating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                Create
                            </button>
                        </form>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-2 space-y-1">
                    <Link
                        href="/dashboard"
                        className={`flex items-center gap-3 px-3 py-2 rounded-r-full cursor-pointer text-sm font-medium ${isActive("/dashboard")
                            ? "bg-linkedin/10 text-linkedin"
                            : "text-gray-700 hover:bg-gray-100"
                            }`}
                    >
                        <LayoutGrid size={18} />
                        At a Glance
                    </Link>

                    <div className="pt-4 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Research Projects
                    </div>

                    {/* Projects List */}
                    {projects.map((project) => (
                        <div key={project.id} className="mt-1">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-r-full text-sm text-gray-700 font-medium hover:bg-gray-100">
                                <Folder size={18} className="text-gray-500" />
                                <span className="truncate flex-1">{project.name}</span>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setDeleteConfirmId(project.id);
                                    }}
                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                    title="Delete project"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <div className="ml-6 border-l-2 border-gray-200 pl-2 mt-1 space-y-1">
                                <Link
                                    href={`/dashboard/topics?project=${project.id}`}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer text-sm transition-colors ${pathname.includes("/topics") && activeProjectId === project.id
                                        ? "bg-linkedin/10 text-linkedin"
                                        : "text-gray-600 hover:bg-gray-100"
                                        }`}
                                >
                                    <FileSpreadsheet size={16} className="text-green-600" />
                                    <span className="truncate">Topics</span>
                                </Link>

                                <Link
                                    href={`/dashboard/content?project=${project.id}`}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer text-sm transition-colors ${pathname.includes("/content") && activeProjectId === project.id
                                        ? "bg-linkedin/10 text-linkedin"
                                        : "text-gray-600 hover:bg-gray-100"
                                        }`}
                                >
                                    <FileText size={16} className="text-linkedin" />
                                    <span className="truncate">Content</span>
                                </Link>
                            </div>
                        </div>
                    ))}

                    {projects.length === 0 && (
                        <div className="px-3 py-4 text-center text-gray-400 text-sm">
                            No projects yet.<br />Create one to get started!
                        </div>
                    )}
                </nav>

                {/* User Info */}
                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">
                                {user.name || "User"}
                            </p>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Sign out"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </div >

            {/* Delete Confirmation Modal */}
            {
                deleteConfirmId && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Project?</h3>
                            <p className="text-gray-600 text-sm mb-6">
                                This will permanently delete this project and all its topics and content. This action cannot be undone.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteProject(deleteConfirmId)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );

}
