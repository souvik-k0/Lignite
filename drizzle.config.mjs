/** @type {import("drizzle-kit").Config} */
export default {
    schema: "./src/lib/db/schema.ts",
    out: "./drizzle",
    dialect: "sqlite",
    dbCredentials: {
        url: "./lignite.db",
    },
};
