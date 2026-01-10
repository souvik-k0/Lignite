import { db, apiUsage } from "./db";
import { eq, and } from "drizzle-orm";

// Rate limits per user per day
export const RATE_LIMITS = {
    RESEARCH: 5,      // Research topics requests per day
    GENERATE: 10,     // Content generation requests per day
};

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
    return new Date().toISOString().split("T")[0];
}

/**
 * Get or create usage record for user for today
 */
async function getOrCreateUsage(userId: string) {
    const today = getTodayDate();

    // Try to find existing record
    const existing = await db.query.apiUsage.findFirst({
        where: and(
            eq(apiUsage.userId, userId),
            eq(apiUsage.date, today)
        ),
    });

    if (existing) {
        return existing;
    }

    // Create new record for today
    const [newRecord] = await db.insert(apiUsage)
        .values({
            userId,
            date: today,
            researchCount: 0,
            generateCount: 0,
        })
        .returning();

    return newRecord;
}

/**
 * Check if user can make a research request
 */
export async function canResearch(userId: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    const usage = await getOrCreateUsage(userId);
    const remaining = RATE_LIMITS.RESEARCH - usage.researchCount;

    return {
        allowed: remaining > 0,
        remaining: Math.max(0, remaining),
        limit: RATE_LIMITS.RESEARCH,
    };
}

/**
 * Check if user can generate content
 */
export async function canGenerate(userId: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    const usage = await getOrCreateUsage(userId);
    const remaining = RATE_LIMITS.GENERATE - usage.generateCount;

    return {
        allowed: remaining > 0,
        remaining: Math.max(0, remaining),
        limit: RATE_LIMITS.GENERATE,
    };
}

/**
 * Increment research count for user
 */
export async function incrementResearch(userId: string): Promise<void> {
    const usage = await getOrCreateUsage(userId);

    await db.update(apiUsage)
        .set({
            researchCount: usage.researchCount + 1,
            updatedAt: new Date(),
        })
        .where(and(
            eq(apiUsage.userId, userId),
            eq(apiUsage.date, getTodayDate())
        ));
}

/**
 * Increment generate count for user
 */
export async function incrementGenerate(userId: string): Promise<void> {
    const usage = await getOrCreateUsage(userId);

    await db.update(apiUsage)
        .set({
            generateCount: usage.generateCount + 1,
            updatedAt: new Date(),
        })
        .where(and(
            eq(apiUsage.userId, userId),
            eq(apiUsage.date, getTodayDate())
        ));
}

/**
 * Get user's current usage stats for today
 */
export async function getUsageStats(userId: string): Promise<{
    research: { used: number; limit: number; remaining: number };
    generate: { used: number; limit: number; remaining: number };
}> {
    const usage = await getOrCreateUsage(userId);

    return {
        research: {
            used: usage.researchCount,
            limit: RATE_LIMITS.RESEARCH,
            remaining: Math.max(0, RATE_LIMITS.RESEARCH - usage.researchCount),
        },
        generate: {
            used: usage.generateCount,
            limit: RATE_LIMITS.GENERATE,
            remaining: Math.max(0, RATE_LIMITS.GENERATE - usage.generateCount),
        },
    };
}
