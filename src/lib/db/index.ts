import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

// Database file path - stored in project root
const dbPath = path.join(process.cwd(), "lignite.db");

// Create SQLite database connection
const sqlite = new Database(dbPath);

// Enable WAL mode for better performance
sqlite.pragma("journal_mode = WAL");

// Create Drizzle database instance with schema
export const db = drizzle(sqlite, { schema });

// Export schema for use in queries
export * from "./schema";
