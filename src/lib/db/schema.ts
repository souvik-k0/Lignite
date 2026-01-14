import { pgTable, text, timestamp, uuid, varchar, jsonb, date, integer } from "drizzle-orm/pg-core";

// Users table (Mirroring Supabase Auth or standalone)
// Ideally, this should be synced with auth.users via triggers, but for now we keep it standalone or manually synced
export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    // Password is handled by Supabase Auth, but we might keep this if we are doing custom auth or just to keep types consistent for now during migration. 
    // However, best practice with Supabase is to rely on their Auth. Use 'id' from Supabase Auth as the primary key here ideally.
    // For this migration, we'll keep the structure but note that 'password' might be unused if using Supabase Auth strictly.
    password: text("password"),
    name: text("name"),
    niche: text("niche"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects table (research niches)
export const projects = pgTable("projects", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// Research Topics table
export const researchTopics = pgTable("research_topics", {
    id: uuid("id").primaryKey().defaultRandom(),
    topic: text("topic").notNull(),
    sourceUrl: text("source_url"),
    sourceTitle: text("source_title"),
    status: text("status").notNull().default("PENDING"),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// Generated Content table
export const generatedContent = pgTable("generated_content", {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    topicId: uuid("topic_id").notNull().references(() => researchTopics.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// API Usage table (for rate limiting)
export const apiUsage = pgTable("api_usage", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    date: date("date").notNull(), // YYYY-MM-DD format
    researchCount: integer("research_count").notNull().default(0),
    generateCount: integer("generate_count").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// System Logs table
export const systemLogs = pgTable("system_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    level: text("level").notNull(), // INFO, ERROR, WARN
    action: text("action").notNull(), // e.g. "USER_SEARCH", "GENERATE_POST", "SYSTEM_ERROR"
    message: text("message").notNull(),
    details: jsonb("details"), // PostgreSQL JSONB is better for querying
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow(),
});

// Feedback table
export const feedback = pgTable("feedback", {
    id: uuid("id").primaryKey().defaultRandom(),
    type: text("type").notNull(), // BUG, FEATURE, OTHER
    message: text("message").notNull(),
    status: text("status").notNull().default("OPEN"), // OPEN, IN_PROGRESS, CLOSED
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ResearchTopic = typeof researchTopics.$inferSelect;
export type NewResearchTopic = typeof researchTopics.$inferInsert;
export type GeneratedContent = typeof generatedContent.$inferSelect;
export type NewGeneratedContent = typeof generatedContent.$inferInsert;
export type ApiUsage = typeof apiUsage.$inferSelect;
export type NewApiUsage = typeof apiUsage.$inferInsert;
export type SystemLog = typeof systemLogs.$inferSelect;
export type NewSystemLog = typeof systemLogs.$inferInsert;
export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;

