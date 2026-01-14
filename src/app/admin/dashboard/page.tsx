"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Activity,
    MessageSquare,
    RefreshCw,
    Trash2,
    Bug,
    Lightbulb,
    CheckCircle2,
    AlertCircle,
    LogOut,
    User,
    ChevronDown,
    ChevronRight
} from "lucide-react";

type LogActivity = {
    id: string;
    level: "INFO" | "WARN" | "ERROR";
    action: string;
    message: string;
    details: string | null;
    createdAt: string;
};

type UserLog = {
    userId: string | null;
    user: { name: string | null; email: string | null } | null;
    activities: LogActivity[];
    firstSeen: string;
    lastSeen: string;
};

type Feedback = {
    id: string;
    type: "BUG" | "FEATURE";
    message: string;
    status: "OPEN" | "CLOSED" | "IN_PROGRESS";
    createdAt: string;
    user: {
        name: string | null;
        email: string | null;
    } | null;
};

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<"logs" | "feedback">("logs");
    const [userLogs, setUserLogs] = useState<UserLog[]>([]);
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

    // Fetch data with grouped logs
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const timestamp = Date.now();
            const [logsRes, fbRes] = await Promise.all([
                fetch(`/api/developer/logs?grouped=true&_t=${timestamp}`),
                fetch(`/api/developer/feedback?_t=${timestamp}`)
            ]);

            if (logsRes.ok) {
                const logsData = await logsRes.json();
                setUserLogs(logsData);
                // Auto-expand all users
                setExpandedUsers(new Set(logsData.map((u: UserLog) => u.userId || "anonymous")));
            }
            if (fbRes.ok) {
                const fbData = await fbRes.json();
                setFeedbacks(fbData);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const toggleUser = (userId: string) => {
        setExpandedUsers(prev => {
            const next = new Set(prev);
            if (next.has(userId)) {
                next.delete(userId);
            } else {
                next.add(userId);
            }
            return next;
        });
    };

    // Update feedback status with optimistic update
    const updateStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === "OPEN" ? "CLOSED" : "OPEN";
        setFeedbacks(prev => prev.map(fb =>
            fb.id === id ? { ...fb, status: newStatus as any } : fb
        ));
        setActionLoading(id);

        try {
            const res = await fetch("/api/developer/feedback", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: newStatus }),
            });

            if (!res.ok) {
                setFeedbacks(prev => prev.map(fb =>
                    fb.id === id ? { ...fb, status: currentStatus as any } : fb
                ));
            }
        } catch (e) {
            console.error(e);
            setFeedbacks(prev => prev.map(fb =>
                fb.id === id ? { ...fb, status: currentStatus as any } : fb
            ));
        } finally {
            setActionLoading(null);
        }
    };

    // Delete feedback item
    const deleteFeedback = async (id: string) => {
        setFeedbacks(prev => prev.filter(f => f.id !== id));
        setActionLoading(id);

        try {
            await fetch(`/api/developer/feedback?id=${id}`, { method: "DELETE" });
        } catch (e) {
            console.error(e);
            fetchData();
        } finally {
            setActionLoading(null);
        }
    };

    // Delete single log activity
    const deleteLog = async (id: string) => {
        // Optimistic: remove from nested structure
        setUserLogs(prev => prev.map(user => ({
            ...user,
            activities: user.activities.filter(a => a.id !== id)
        })).filter(user => user.activities.length > 0));

        try {
            await fetch(`/api/developer/logs?id=${id}`, { method: "DELETE" });
        } catch (e) {
            console.error(e);
            fetchData();
        }
    };

    // Clear all logs
    const clearLogs = async () => {
        const previous = [...userLogs];
        setUserLogs([]);
        setActionLoading("clear-all");

        try {
            const res = await fetch("/api/developer/logs", { method: "DELETE" });
            if (!res.ok) setUserLogs(previous);
        } catch (e) {
            console.error(e);
            setUserLogs(previous);
        } finally {
            setActionLoading(null);
        }
    };

    const handleLogout = async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        window.location.href = "/admin/login";
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const totalActivities = userLogs.reduce((sum, u) => sum + u.activities.length, 0);
    const openCount = feedbacks.filter(f => f.status === "OPEN").length;

    return (
        <div className="min-h-screen flex flex-col bg-linkedin-page-bg font-sans">
            {/* Header */}
            <header className="bg-white border-b border-linkedin-gray-light px-4 sm:px-8 py-4 sm:py-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 shadow-sm">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-linkedin-charcoal">Developer Dashboard</h1>
                    <p className="text-linkedin-gray text-xs sm:text-sm">System observability and feedback loop</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="p-2.5 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors text-linkedin-charcoal disabled:opacity-50"
                        title="Refresh Data"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-linkedin-charcoal text-white text-sm font-medium rounded-lg hover:bg-black transition-colors"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <nav className="flex border-b border-linkedin-gray-light bg-white px-4 sm:px-8 overflow-x-auto">
                <button
                    onClick={() => setActiveTab("logs")}
                    className={`py-3 sm:py-4 px-4 sm:px-6 font-semibold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === "logs"
                            ? "border-linkedin-charcoal text-linkedin-charcoal"
                            : "border-transparent text-linkedin-gray hover:text-linkedin-charcoal"
                        }`}
                >
                    <Activity size={16} className="sm:w-[18px] sm:h-[18px]" />
                    <span className="hidden sm:inline">System </span>Logs
                    <span className="bg-gray-200 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full">
                        {totalActivities}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab("feedback")}
                    className={`py-3 sm:py-4 px-4 sm:px-6 font-semibold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === "feedback"
                            ? "border-linkedin-charcoal text-linkedin-charcoal"
                            : "border-transparent text-linkedin-gray hover:text-linkedin-charcoal"
                        }`}
                >
                    <MessageSquare size={16} className="sm:w-[18px] sm:h-[18px]" />
                    Feedback
                    {openCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                            {openCount}
                        </span>
                    )}
                </button>
            </nav>

            {/* Content */}
            <main className="flex-1 overflow-auto p-4 sm:p-8">
                {activeTab === "logs" ? (
                    <div className="space-y-4 max-w-5xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-semibold text-linkedin-charcoal text-lg">
                                User Activity ({userLogs.length} users)
                            </h3>
                            <button
                                onClick={clearLogs}
                                disabled={userLogs.length === 0 || actionLoading === "clear-all"}
                                className="text-xs text-red-600 hover:text-red-700 hover:underline font-medium disabled:opacity-50"
                            >
                                {actionLoading === "clear-all" ? "Clearing..." : "Clear All Logs"}
                            </button>
                        </div>

                        {userLogs.length === 0 ? (
                            <div className="bg-white rounded-xl p-12 text-center text-linkedin-gray border">
                                <Activity size={48} className="mx-auto mb-4 opacity-30" />
                                <p className="font-medium">No activity logs</p>
                                <p className="text-sm mt-1">User activities will appear here</p>
                            </div>
                        ) : (
                            userLogs.map((userLog) => {
                                const key = userLog.userId || "anonymous";
                                const isExpanded = expandedUsers.has(key);

                                return (
                                    <div key={key} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                                        {/* User Header */}
                                        <button
                                            onClick={() => toggleUser(key)}
                                            className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                                        >
                                            <div className="p-2 bg-linkedin-light/20 rounded-full text-linkedin">
                                                <User size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-linkedin-charcoal">
                                                    {userLog.user?.name || "Anonymous User"}
                                                </div>
                                                <div className="text-xs text-linkedin-gray">
                                                    {userLog.user?.email || "No email"} • {userLog.activities.length} activities
                                                </div>
                                            </div>
                                            <div className="text-linkedin-gray">
                                                {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                            </div>
                                        </button>

                                        {/* Activities */}
                                        {isExpanded && (
                                            <div className="border-t divide-y divide-gray-100">
                                                {userLog.activities.map((activity) => (
                                                    <div key={activity.id} className="p-4 pl-16 flex items-start gap-4 hover:bg-gray-50/50">
                                                        <span className={`shrink-0 mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${activity.level === "ERROR" ? "bg-red-100 text-red-700" :
                                                            activity.level === "WARN" ? "bg-yellow-100 text-yellow-700" :
                                                                "bg-blue-100 text-blue-700"
                                                            }`}>
                                                            {activity.level}
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-medium">
                                                                    {activity.action}
                                                                </code>
                                                                <span className="text-[10px] text-linkedin-gray">
                                                                    {new Date(activity.createdAt).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-linkedin-charcoal">{activity.message}</p>
                                                            {activity.details && (
                                                                <pre className="mt-2 text-xs text-linkedin-gray bg-gray-50 p-2 rounded overflow-x-auto border">
                                                                    {activity.details}
                                                                </pre>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => deleteLog(activity.id)}
                                                            className="shrink-0 p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto space-y-4">
                        {feedbacks.length === 0 ? (
                            <div className="bg-white rounded-xl p-12 text-center text-linkedin-gray border">
                                <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
                                <p className="font-medium">No feedback received yet</p>
                            </div>
                        ) : (
                            feedbacks.map((fb) => (
                                <div
                                    key={fb.id}
                                    className={`bg-white p-5 rounded-xl border shadow-sm transition-all ${fb.status === "CLOSED" ? "opacity-60" : ""
                                        }`}
                                >
                                    <div className="flex gap-4">
                                        <div className={`shrink-0 p-2.5 rounded-lg h-fit ${fb.type === "BUG" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                                            }`}>
                                            {fb.type === "BUG" ? <Bug size={20} /> : <Lightbulb size={20} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <div>
                                                    <h3 className="font-bold text-linkedin-charcoal">
                                                        {fb.type === "BUG" ? "Bug Report" : "Feature Request"}
                                                    </h3>
                                                    {fb.user && (
                                                        <p className="text-xs text-linkedin-gray mt-0.5">
                                                            by <span className="font-medium text-linkedin-charcoal">{fb.user.name || "Unknown"}</span>
                                                            {fb.user.email && ` (${fb.user.email})`}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-xs text-linkedin-gray">
                                                        {new Date(fb.createdAt).toLocaleDateString()}
                                                    </span>
                                                    <button
                                                        onClick={() => deleteFeedback(fb.id)}
                                                        disabled={actionLoading === fb.id}
                                                        className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-colors disabled:opacity-50"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-linkedin-charcoal mb-4">{fb.message}</p>
                                            <button
                                                onClick={() => updateStatus(fb.id, fb.status)}
                                                disabled={actionLoading === fb.id}
                                                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50 ${fb.status === "OPEN"
                                                    ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                                    : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                                                    }`}
                                            >
                                                {fb.status === "OPEN" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                                {fb.status === "OPEN" ? "Mark as Closed" : "Reopen"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
