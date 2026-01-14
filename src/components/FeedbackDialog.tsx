"use client";

import { useState } from "react";
import { Bug, Lightbulb, MessageSquarePlus, X, Loader2 } from "lucide-react";

export default function FeedbackDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [type, setType] = useState<"BUG" | "FEATURE">("BUG");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/developer/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, message }),
            });

            if (!res.ok) throw new Error("Failed to submit");

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setIsOpen(false);
                setMessage("");
                setType("BUG");
            }, 2000);
        } catch (error) {
            console.error(error);
            alert("Failed to submit feedback. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-linkedin text-white p-3 rounded-full shadow-lg hover:bg-linkedin-dark transition-colors z-50 flex items-center gap-2"
                title="Send Feedback"
            >
                <MessageSquarePlus size={24} />
                <span className="hidden md:inline font-medium pr-1">Feedback</span>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-linkedin-page-bg px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-linkedin-charcoal">Send Feedback</h3>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {success ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h4 className="text-xl font-bold text-gray-800 mb-2">Thank You!</h4>
                        <p className="text-gray-600">Your feedback has been sent directly to the developer.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6">
                        {/* Type Selection */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <button
                                type="button"
                                onClick={() => setType("BUG")}
                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${type === "BUG"
                                        ? "bg-red-50 border-red-200 text-red-700 ring-1 ring-red-200"
                                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                <Bug size={18} />
                                <span className="font-medium">Report Bug</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setType("FEATURE")}
                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${type === "FEATURE"
                                        ? "bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-200"
                                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                <Lightbulb size={18} />
                                <span className="font-medium">Request Feature</span>
                            </button>
                        </div>

                        {/* Message */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Describe the {type === "BUG" ? "issue" : "idea"}
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                required
                                placeholder={type === "BUG"
                                    ? "What happened? Steps to reproduce..."
                                    : "I wish the app could..."}
                                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-linkedin focus:border-transparent outline-none resize-none text-sm"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!message.trim() || isSubmitting}
                                className="px-6 py-2 bg-linkedin text-white rounded-lg hover:bg-linkedin-dark transition-colors font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting && <Loader2 className="animate-spin" size={16} />}
                                Send Feedback
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
