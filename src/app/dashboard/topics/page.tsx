"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    FileSpreadsheet,
    ExternalLink,
    Check,
    X,
    Wand2,
    Loader2,
    RefreshCw,
    AlertCircle,
} from "lucide-react";

interface Topic {
    id: string;
    topic: string;
    sourceUrl?: string;
    sourceTitle?: string;
    status: string;
    createdAt: string;
}

export default function TopicsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const projectId = searchParams.get("project");
    const [topics, setTopics] = useState<Topic[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchTopics = async () => {
        if (!projectId) return;
        try {
            const res = await fetch(`/api/topics?project=${projectId}`);
            const data = await res.json();
            setTopics(data);
        } catch (error) {
            console.error("Failed to fetch topics:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTopics();
    }, [projectId]);

    const handleResearch = async () => {
        if (!projectId) return;
        setIsProcessing(true);
        try {
            const res = await fetch("/api/topics", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId }),
            });
            if (res.ok) {
                await fetchTopics();
            }
        } catch (error) {
            console.error("Research failed:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleApprove = async (id: string) => {
        setProcessingId(id);
        try {
            const res = await fetch(`/api/topics/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "APPROVED", generateContent: true }),
            });
            if (res.ok) {
                await fetchTopics();
            }
        } catch (error) {
            console.error("Approve failed:", error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string) => {
        setProcessingId(id);
        try {
            const res = await fetch(`/api/topics/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "REJECTED" }),
            });
            if (res.ok) {
                await fetchTopics();
            }
        } catch (error) {
            console.error("Reject failed:", error);
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "APPROVED":
                return "bg-green-100 text-green-800";
            case "REJECTED":
                return "bg-red-100 text-red-800";
            case "PENDING":
                return "bg-yellow-100 text-yellow-800";
            case "GENERATED":
                return "bg-blue-100 text-blue-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    if (!projectId) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-linkedin-page-bg text-center p-8">
                <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
                <h2 className="text-lg font-medium text-gray-700 mb-2">No project selected</h2>
                <p className="text-gray-500 text-sm">
                    Select a project from the sidebar to view topics
                </p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-linkedin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-linkedin-page-bg">
            {/* Sheet Header */}
            <div className="flex items-center gap-2 md:gap-4 pl-14 md:pl-4 pr-3 md:pr-4 py-3 border-b border-gray-200">
                <FileSpreadsheet className="text-linkedin-green flex-shrink-0" size={24} />
                <div className="min-w-0">
                    <h1 className="text-base md:text-lg font-medium text-linkedin-charcoal leading-tight">
                        Research Topics
                    </h1>
                    <p className="text-xs text-linkedin-gray">
                        {topics.length} topics found
                    </p>
                </div>
                <div className="ml-auto flex items-center">
                    <button
                        onClick={handleResearch}
                        disabled={isProcessing}
                        className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-linkedin text-white rounded-lg hover:bg-linkedin-dark text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        {isProcessing ? (
                            <Loader2 className="animate-spin" size={16} />
                        ) : (
                            <RefreshCw size={16} />
                        )}
                        <span className="hidden md:inline">Research Topics</span>
                        <span className="md:hidden">Research</span>
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto">
                <table className="w-full min-w-[600px] border-collapse text-sm">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="w-12 border border-gray-200 p-2 text-center text-gray-500 font-medium">
                                #
                            </th>
                            <th className="w-[45%] border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">
                                Topic
                            </th>
                            <th className="w-[20%] border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">
                                Source
                            </th>
                            <th className="w-[15%] border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">
                                Status
                            </th>
                            <th className="w-[15%] border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {topics.map((topic, index) => (
                            <tr key={topic.id} className="hover:bg-blue-50 group">
                                <td className="border border-gray-200 p-2 text-center bg-gray-50 text-gray-500">
                                    {index + 1}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-gray-800">
                                    {topic.topic}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-gray-600">
                                    {topic.sourceUrl ? (
                                        <a
                                            href={topic.sourceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-blue-600 hover:underline"
                                        >
                                            <ExternalLink size={12} />
                                            {topic.sourceTitle || "Link"}
                                        </a>
                                    ) : (
                                        <span className="text-gray-400 text-xs">AI Generated</span>
                                    )}
                                </td>
                                <td className="border border-gray-200 px-3 py-2">
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusStyle(
                                            topic.status
                                        )}`}
                                    >
                                        {topic.status}
                                    </span>
                                </td>
                                <td className="border border-gray-200 px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        {topic.status === "PENDING" && (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(topic.id)}
                                                    disabled={processingId === topic.id}
                                                    className="p-1.5 hover:bg-green-100 text-green-600 rounded transition-colors disabled:opacity-50"
                                                    title="Approve & Generate"
                                                >
                                                    {processingId === topic.id ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : (
                                                        <Check size={16} />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleReject(topic.id)}
                                                    disabled={processingId === topic.id}
                                                    className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors disabled:opacity-50"
                                                    title="Reject"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </>
                                        )}
                                        {topic.status === "GENERATED" && (
                                            <button
                                                onClick={() => router.push(`/dashboard/content?project=${projectId}`)}
                                                className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100"
                                            >
                                                <Wand2 size={12} /> View
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {topics.length === 0 && (
                            <tr>
                                <td colSpan={5} className="border border-gray-200 p-8 text-center text-gray-400">
                                    No topics yet. Click <strong>Research Topics</strong> to find trending topics.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
