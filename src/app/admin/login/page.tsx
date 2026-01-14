"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, Loader2 } from "lucide-react";

export default function AdminLogin() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            if (res.ok) {
                router.push("/admin/dashboard");
            } else {
                setError("Invalid password");
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100">
                <div className="flex justify-center mb-6">
                    <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center text-white">
                        <Lock size={20} />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Admin Access</h1>
                <p className="text-center text-gray-500 mb-8">Restricted area. Authorized personnel only.</p>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter Admin Password"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !password}
                        className="w-full bg-gray-900 text-white p-3 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <>Login <ArrowRight size={18} /></>}
                    </button>
                </form>
            </div>
        </div>
    );
}
