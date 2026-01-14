import { db } from "@/lib/db";
import { systemLogs } from "@/lib/db/schema";
import { headers } from "next/headers";

type LogLevel = "INFO" | "WARN" | "ERROR";
type LogAction =
    | "USER_SEARCH"
    | "GENERATE_POST"
    | "SYSTEM_ERROR"
    | "AUTH_EVENT"
    | "FEEDBACK_SUBMIT"
    | "API_REQUEST";

export class Logger {
    static async log(
        level: LogLevel,
        action: LogAction,
        message: string,
        details?: Record<string, any>,
        userId?: string
    ) {
        try {
            // In a real app we might want to fire and forget, but for SQLite correctness we await
            await db.insert(systemLogs).values({
                level,
                action,
                message,
                details: details ? details : null,
                userId: userId || null,
            });

            // Also log to console for dev
            const consoleMethod = level === "ERROR" ? console.error : level === "WARN" ? console.warn : console.log;
            consoleMethod(`[${level}] ${action}: ${message}`, details || "");

        } catch (error) {
            // Fallback if DB logging fails - critical to not crash the app
            console.error("FATAL: Failed to write to system_logs", error);
        }
    }

    static async info(action: LogAction, message: string, details?: Record<string, any>, userId?: string) {
        return this.log("INFO", action, message, details, userId);
    }

    static async warn(action: LogAction, message: string, details?: Record<string, any>, userId?: string) {
        return this.log("WARN", action, message, details, userId);
    }

    static async error(action: LogAction, message: string, details?: Record<string, any>, userId?: string) {
        return this.log("ERROR", action, message, details, userId);
    }
}
