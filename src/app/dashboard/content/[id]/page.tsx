import { auth } from "@/lib/auth";
import { db, generatedContent } from "@/lib/db";
import { eq } from "drizzle-orm";
import { FileText, Clock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import CopyButton from "@/components/CopyButton";
import PostAnalyzer from "@/components/PostAnalyzer";

export default async function ContentPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session?.user?.id) return null;

    const { id } = await params;

    const content = await db.query.generatedContent.findFirst({
        where: eq(generatedContent.id, id),
    });

    if (!content || content.userId !== session.user.id) {
        notFound();
    }

    return (
        <div className="flex flex-col h-full bg-linkedin-page-bg">
            {/* Doc Header */}
            <div className="flex items-center gap-2 md:gap-4 pl-14 md:pl-4 pr-3 md:pr-4 py-3 border-b border-gray-200">
                <FileText className="text-linkedin flex-shrink-0" size={24} />
                <div className="min-w-0 flex-1">
                    <h1 className="text-base md:text-lg font-medium text-linkedin-charcoal leading-tight truncate">
                        {content.title}
                    </h1>
                    <div className="flex gap-2 text-xs text-linkedin-gray mt-1">
                        <Clock size={12} />
                        <span>Generated {new Date(content.createdAt!).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className="flex items-center">
                    <CopyButton content={content.content} />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto bg-linkedin-page-bg">
                <div className="max-w-6xl mx-auto my-4 md:my-8 px-4">
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Document */}
                        <div className="flex-1">
                            <div className="bg-white shadow-lg border border-gray-200 rounded-xl p-6 md:p-10">
                                <div className="prose prose-lg prose-gray max-w-none">
                                    <div className="whitespace-pre-wrap text-gray-800 leading-relaxed text-base">
                                        {content.content}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Post Analyzer Sidebar */}
                        <div className="lg:w-80 shrink-0">
                            <div className="sticky top-4">
                                <PostAnalyzer content={content.content} />

                                {/* Tips Card */}
                                <div className="mt-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-100 p-4">
                                    <h4 className="font-semibold text-purple-800 mb-2">💡 Pro Tips</h4>
                                    <ul className="text-sm text-purple-700 space-y-2">
                                        <li>• Add links in the first comment, not the post</li>
                                        <li>• Reply to comments within 15-30 mins</li>
                                        <li>• Leave 10-20 comments on others' posts daily</li>
                                        <li>• Consider carousel posts for 11.2x more reach</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-100 border-t border-gray-300 px-4 py-2 flex items-center justify-between text-xs text-gray-500">
                <Link href="/dashboard/content" className="hover:text-blue-600">
                    ← Back to all documents
                </Link>
                <span>
                    {content.content.length} characters • {content.content.split(/\s+/).length} words
                </span>
            </div>
        </div>
    );
}
