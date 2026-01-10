"use client";

import { useMemo } from "react";
import {
    CheckCircle2,
    XCircle,
    AlertCircle,
    Sparkles,
    Clock,
    MessageSquare,
    Type,
    Hash,
    Smile,
} from "lucide-react";

interface PostAnalyzerProps {
    content: string;
}

interface AnalysisResult {
    label: string;
    status: "pass" | "warning" | "fail";
    message: string;
    icon: React.ReactNode;
}

export default function PostAnalyzer({ content }: PostAnalyzerProps) {
    const analysis = useMemo(() => {
        const results: AnalysisResult[] = [];

        // Character count (optimal: 1,242-2,500)
        const charCount = content.length;
        const charStatus = charCount >= 1200 && charCount <= 2500
            ? "pass"
            : charCount >= 800 && charCount <= 3000
                ? "warning"
                : "fail";
        results.push({
            label: "Character Count",
            status: charStatus,
            message: `${charCount} characters (optimal: 1,242-2,500)`,
            icon: <Type size={16} />,
        });

        // Paragraph count (optimal: 8-12)
        const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        const paragraphCount = paragraphs.length;
        const paragraphStatus = paragraphCount >= 8 && paragraphCount <= 12
            ? "pass"
            : paragraphCount >= 5 && paragraphCount <= 15
                ? "warning"
                : "fail";
        results.push({
            label: "Paragraphs",
            status: paragraphStatus,
            message: `${paragraphCount} paragraphs (optimal: 8-12)`,
            icon: <MessageSquare size={16} />,
        });

        // Word count
        const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
        const wordStatus = wordCount >= 200 && wordCount <= 350
            ? "pass"
            : wordCount >= 150 && wordCount <= 400
                ? "warning"
                : "fail";
        results.push({
            label: "Word Count",
            status: wordStatus,
            message: `${wordCount} words (optimal: 200-350)`,
            icon: <Type size={16} />,
        });

        // Emoji count (optimal: 1-8)
        const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
        const emojis = content.match(emojiRegex) || [];
        const emojiCount = emojis.length;
        const emojiStatus = emojiCount >= 1 && emojiCount <= 8
            ? "pass"
            : emojiCount === 0
                ? "warning"
                : "warning";
        results.push({
            label: "Strategic Emojis",
            status: emojiStatus,
            message: `${emojiCount} emojis (optimal: 1-8)`,
            icon: <Smile size={16} />,
        });

        // Hashtag check (should be 0 - they reduce reach by 81%)
        const hashtagRegex = /#\w+/g;
        const hashtags = content.match(hashtagRegex) || [];
        const hashtagStatus = hashtags.length === 0 ? "pass" : "fail";
        results.push({
            label: "No Hashtags",
            status: hashtagStatus,
            message: hashtags.length === 0
                ? "No hashtags (good! they reduce reach by 81%)"
                : `${hashtags.length} hashtags found (remove them!)`,
            icon: <Hash size={16} />,
        });

        // Question ending check
        const lastParagraph = paragraphs[paragraphs.length - 1] || "";
        const hasQuestion = lastParagraph.includes("?");
        results.push({
            label: "Ends with Question",
            status: hasQuestion ? "pass" : "warning",
            message: hasQuestion
                ? "Ends with a question (72% better engagement)"
                : "Consider ending with a question",
            icon: <MessageSquare size={16} />,
        });

        // Calculate overall score
        const passCount = results.filter(r => r.status === "pass").length;
        const score = Math.round((passCount / results.length) * 100);

        return { results, score };
    }, [content]);

    const getStatusIcon = (status: "pass" | "warning" | "fail") => {
        switch (status) {
            case "pass":
                return <CheckCircle2 className="text-green-500" size={18} />;
            case "warning":
                return <AlertCircle className="text-yellow-500" size={18} />;
            case "fail":
                return <XCircle className="text-red-500" size={18} />;
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
        if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
        return "text-red-600 bg-red-50 border-red-200";
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Header with Score */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="text-purple-500" size={20} />
                    <h3 className="font-semibold text-gray-800">Post Quality</h3>
                </div>
                <div className={`px-3 py-1 rounded-full border font-bold ${getScoreColor(analysis.score)}`}>
                    {analysis.score}%
                </div>
            </div>

            {/* Checklist */}
            <div className="p-4 space-y-3">
                {analysis.results.map((result, index) => (
                    <div key={index} className="flex items-start gap-3">
                        {getStatusIcon(result.status)}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700">{result.label}</p>
                            <p className="text-xs text-gray-500">{result.message}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Best Posting Times */}
            <div className="p-4 bg-blue-50 border-t border-blue-100">
                <div className="flex items-start gap-2">
                    <Clock className="text-blue-500 mt-0.5" size={16} />
                    <div>
                        <p className="text-sm font-medium text-blue-800">Best Posting Times</p>
                        <p className="text-xs text-blue-600">
                            Sundays & Saturdays • 11AM-1PM GMT
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
