import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as schema from "./schema";

const sqlite = new Database("db.sqlite", { create: true });

export const db = drizzle(sqlite, { schema });

export const setupDatabase = () => {
  migrate(db, { migrationsFolder: "./drizzle" });
};
