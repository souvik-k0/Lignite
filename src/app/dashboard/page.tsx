import { createClient } from "@/lib/supabase/server";
import { db, researchTopics, generatedContent, projects } from "@/lib/db";
import { eq, count, desc, gte, and } from "drizzle-orm";
import { Search, Activity, FolderOpen, ArrowRight, Sparkles, Clock, Zap } from "lucide-react";
import Link from "next/link";
import { getUsageStats, RATE_LIMITS } from "@/lib/rateLimit";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get user's projects with stats
    const userProjects = await db.query.projects.findMany({
        where: eq(projects.userId, user.id),
        orderBy: (p, { desc }) => [desc(p.createdAt)],
    });

    // Get total stats
    const [topicsCount] = await db
        .select({ count: count() })
        .from(researchTopics)
        .where(eq(researchTopics.userId, user.id));

    const [contentCount] = await db
        .select({ count: count() })
        .from(generatedContent)
        .where(eq(generatedContent.userId, user.id));

    // Get topics from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTopics = await db.query.researchTopics.findMany({
        where: and(
            eq(researchTopics.userId, user.id),
            gte(researchTopics.createdAt, thirtyDaysAgo)
        ),
        orderBy: (t, { desc }) => [desc(t.createdAt)],
    });

    // Get usage stats for today
    const usageStats = await getUsageStats(user.id);

    return (
        <div className="p-4 md:p-8 pt-16 md:pt-8 h-full bg-linkedin-page-bg overflow-y-auto">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-2xl font-bold text-linkedin-charcoal mb-1">At a Glance</h1>
                <p className="text-linkedin-gray mb-6">Your research overview</p>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-linkedin-gray-light flex items-center gap-4">
                        <div className="p-2 bg-linkedin/10 rounded-lg text-linkedin">
                            <Search size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-linkedin-charcoal">{topicsCount.count}</p>
                            <p className="text-sm text-linkedin-gray">Topics Researched</p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm border border-linkedin-gray-light flex items-center gap-4">
                        <div className="p-2 bg-linkedin-green/10 rounded-lg text-linkedin-green">
                            <Activity size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-linkedin-charcoal">{contentCount.count}</p>
                            <p className="text-sm text-linkedin-gray">Content Generated</p>
                        </div>
                    </div>
                </div>

                {/* Daily Quota */}
                <div className="bg-gradient-to-r from-linkedin-orange/15 to-linkedin-orange/5 p-4 rounded-xl border border-linkedin-orange/25 mb-8">
                    <div className="flex items-center gap-2 mb-3">
                        <Zap className="text-linkedin-orange" size={18} />
                        <h3 className="font-semibold text-linkedin-charcoal">Daily AI Quota</h3>
                        <span className="text-xs text-linkedin-gray ml-auto">Resets at midnight</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-linkedin-gray">Research Topics</span>
                                <span className="font-medium text-linkedin-charcoal">{usageStats.research.used}/{usageStats.research.limit}</span>
                            </div>
                            <div className="h-2 bg-white rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-linkedin rounded-full transition-all"
                                    style={{ width: `${(usageStats.research.used / usageStats.research.limit) * 100}%` }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-linkedin-gray">Content Generation</span>
                                <span className="font-medium text-linkedin-charcoal">{usageStats.generate.used}/{usageStats.generate.limit}</span>
                            </div>
                            <div className="h-2 bg-white rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-linkedin-green rounded-full transition-all"
                                    style={{ width: `${(usageStats.generate.used / usageStats.generate.limit) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Topics */}
                <h2 className="text-lg font-semibold text-gray-800 mb-3">
                    Recent Topics (Last 30 Days)
                </h2>

                {recentTopics.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center mb-8">
                        <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">No topics researched in the last 30 days</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
                        <div className="max-h-64 overflow-y-auto">
                            {recentTopics.map((topic, index) => (
                                <div
                                    key={topic.id}
                                    className={`p-3 flex items-start gap-3 ${index !== recentTopics.length - 1 ? 'border-b border-gray-100' : ''}`}
                                >
                                    <div className="p-1.5 bg-blue-50 rounded text-blue-500 mt-0.5">
                                        <Search size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-800 font-medium truncate">
                                            {topic.topic}
                                        </p>
                                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                            <Clock size={10} />
                                            {new Date(topic.createdAt!).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${topic.status === 'APPROVED'
                                        ? 'bg-green-100 text-green-700'
                                        : topic.status === 'REJECTED'
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {topic.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Projects */}
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Your Projects</h2>

                {userProjects.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                        <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="font-medium text-gray-700 mb-2">No projects yet</h3>
                        <p className="text-gray-500 text-sm mb-4">
                            Create a research project to start finding trending topics
                        </p>
                        <p className="text-sm text-gray-400">
                            Click <strong>+ New Project</strong> in the sidebar to get started
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {userProjects.map((project) => (
                            <Link
                                key={project.id}
                                href={`/dashboard/topics?project=${project.id}`}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 hover:shadow-md transition-shadow group block"
                            >
                                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                    <FolderOpen size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">{project.name}</p>
                                    <p className="text-xs text-gray-400">
                                        Created {new Date(project.createdAt!).toLocaleDateString()}
                                    </p>
                                </div>
                                <ArrowRight
                                    size={18}
                                    className="text-gray-300 group-hover:text-blue-500 transition-colors"
                                />
                            </Link>
                        ))}
                    </div>
                )}

                {/* Tip */}
                <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                    <Sparkles className="text-blue-500 mt-0.5" size={18} />
                    <div>
                        <p className="text-sm font-medium text-blue-800">Pro tip</p>
                        <p className="text-sm text-blue-600">
                            Create separate projects for different niches to keep your research organized.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
