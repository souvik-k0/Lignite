import { auth } from "@/lib/auth";
import { db, generatedContent } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { FileText, Clock, FolderOpen, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default async function ContentListPage({
    searchParams,
}: {
    searchParams?: Promise<{ project?: string }>;
}) {
    const session = await auth();
    if (!session?.user?.id) return null;

    const params = await searchParams;
    const projectId = params?.project;

    const whereClause = projectId
        ? and(
            eq(generatedContent.userId, session.user.id),
            eq(generatedContent.projectId, projectId)
        )
        : eq(generatedContent.userId, session.user.id);

    const contents = await db.query.generatedContent.findMany({
        where: whereClause,
        orderBy: (content, { desc }) => [desc(content.createdAt)],
    });

    return (
        <div className="flex flex-col h-full bg-linkedin-page-bg">
            {/* Header */}
            <div className="flex items-center gap-2 md:gap-4 pl-14 md:pl-4 pr-3 md:pr-4 py-3 border-b border-gray-200">
                <FolderOpen className="text-linkedin flex-shrink-0" size={24} />
                <div className="min-w-0">
                    <h1 className="text-base md:text-lg font-medium text-linkedin-charcoal leading-tight">
                        Generated Content
                    </h1>
                    <p className="text-xs text-linkedin-gray">
                        {contents.length} {contents.length === 1 ? "post" : "posts"} generated
                    </p>
                </div>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-auto p-4 md:p-6 bg-linkedin-page-bg">
                {contents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <FileText className="w-16 h-16 text-gray-300 mb-4" />
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">
                            No posts yet
                        </h2>
                        <p className="text-gray-500 mb-6 max-w-sm px-4">
                            {projectId
                                ? "Approve topics to generate LinkedIn posts"
                                : "Select a project and approve topics to generate content"}
                        </p>
                        {projectId && (
                            <Link
                                href={`/dashboard/topics?project=${projectId}`}
                                className="px-6 py-2 bg-linkedin text-white rounded-lg hover:bg-linkedin-dark transition-colors font-medium"
                            >
                                Go to Topics
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto space-y-4">
                        {contents.map((content) => {
                            // Get first line as hook preview
                            const firstLine = content.content.split('\n')[0].slice(0, 100);
                            const charCount = content.content.length;
                            const isOptimalLength = charCount >= 1200 && charCount <= 2500;

                            return (
                                <Link
                                    key={content.id}
                                    href={`/dashboard/content/${content.id}`}
                                    className="block bg-white rounded-xl border border-gray-200 hover:border-linkedin hover:shadow-md transition-all p-4 group"
                                >
                                    {/* Title Row */}
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                                            <FileText className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                                                {content.title}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {new Date(content.createdAt!).toLocaleDateString()}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full ${isOptimalLength ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {charCount} chars
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                                    </div>

                                    {/* Preview */}
                                    <div className="bg-gray-50 rounded-lg p-3 ml-11">
                                        <p className="text-sm text-gray-600 line-clamp-2">
                                            {firstLine}...
                                        </p>
                                    </div>
                                </Link>
                            );
                        })}

                        {/* Tip */}
                        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 flex items-start gap-3">
                            <Sparkles className="w-5 h-5 text-blue-500 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-blue-800">Click any post to view details</p>
                                <p className="text-xs text-blue-600">See quality score, analysis, and posting tips</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
