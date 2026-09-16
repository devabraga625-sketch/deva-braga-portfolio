import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"), email: varchar("email", { length: 320 }), loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(), lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const behanceProjects = mysqlTable("behance_projects", {
  id: int("id").autoincrement().primaryKey(), projectKey: varchar("projectKey", { length: 191 }).notNull().unique(), title: text("title").notNull(), sourceUrl: text("sourceUrl").notNull(), cover: text("cover"), description: text("description"), publishedAt: timestamp("publishedAt"), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const behanceSyncJobs = mysqlTable("behance_sync_jobs", {
  id: int("id").autoincrement().primaryKey(), name: varchar("name", { length: 120 }).notNull().unique(), scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }), lastSyncedAt: timestamp("lastSyncedAt"), lastStatus: varchar("lastStatus", { length: 32 }), lastError: text("lastError"), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const quoteRequests = mysqlTable("quote_requests", {
  id: int("id").autoincrement().primaryKey(), name: varchar("name", { length: 160 }).notNull(), email: varchar("email", { length: 320 }).notNull(), phone: varchar("phone", { length: 40 }), message: text("message").notNull(), consent: int("consent").notNull(), status: mysqlEnum("status", ["new", "read", "replied"]).default("new").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const trafficEvents = mysqlTable("traffic_events", {
  id: int("id").autoincrement().primaryKey(), eventType: varchar("eventType", { length: 64 }).notNull(), path: varchar("path", { length: 255 }).notNull(), projectKey: varchar("projectKey", { length: 191 }), visitorId: varchar("visitorId", { length: 64 }).notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type BehanceProject = typeof behanceProjects.$inferSelect;
export type BehanceSyncJob = typeof behanceSyncJobs.$inferSelect;
export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type TrafficEvent = typeof trafficEvents.$inferSelect;
