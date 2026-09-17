import { int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"), email: varchar("email", { length: 320 }), loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  twoFactorSecret: varchar("twoFactorSecret", { length: 512 }), twoFactorEnabled: int("twoFactorEnabled").default(0).notNull(), twoFactorRequired: int("twoFactorRequired").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(), lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const behanceProjects = mysqlTable("behance_projects", {
  id: int("id").autoincrement().primaryKey(), projectKey: varchar("projectKey", { length: 191 }).notNull().unique(), title: text("title").notNull(), sourceUrl: text("sourceUrl").notNull(), cover: text("cover"), description: text("description"), publishedAt: timestamp("publishedAt"), createdAt: timestamp("createdAt").defaultNow().notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const behanceSyncJobs = mysqlTable("behance_sync_jobs", {
  id: int("id").autoincrement().primaryKey(), name: varchar("name", { length: 120 }).notNull().unique(), scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }), lastSyncedAt: timestamp("lastSyncedAt"), lastStatus: varchar("lastStatus", { length: 32 }), lastError: text("lastError"), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const quoteRequests = mysqlTable("quote_requests", {
  id: int("id").autoincrement().primaryKey(), name: varchar("name", { length: 160 }).notNull(), email: varchar("email", { length: 320 }).notNull(), phone: varchar("phone", { length: 40 }), message: text("message").notNull(), consent: int("consent").notNull(), status: varchar("status", { length: 32 }).default("pending").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const trafficEvents = mysqlTable("traffic_events", {
  id: int("id").autoincrement().primaryKey(), eventType: varchar("eventType", { length: 64 }).notNull(), path: varchar("path", { length: 255 }).notNull(), projectKey: varchar("projectKey", { length: 191 }), visitorId: varchar("visitorId", { length: 64 }).notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const mediaDownloads = mysqlTable("media_downloads", {
  id: int("id").autoincrement().primaryKey(), projectKey: varchar("projectKey", { length: 191 }).notNull(), mediaIndex: int("mediaIndex").notNull(), downloads: int("downloads").default(0).notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ projectMediaUnique: uniqueIndex("media_downloads_project_media_unique").on(table.projectKey, table.mediaIndex) }));

export const mediaDownloadEvents = mysqlTable("media_download_events", {
  id: int("id").autoincrement().primaryKey(), projectKey: varchar("projectKey", { length: 191 }).notNull(), mediaIndex: int("mediaIndex").notNull(), createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const portfolioProjectOverrides = mysqlTable("portfolio_project_overrides", {
  id: int("id").autoincrement().primaryKey(), projectKey: varchar("projectKey", { length: 191 }).notNull().unique(), title: text("title"), description: text("description"), year: varchar("year", { length: 32 }), thumbnail: text("thumbnail"), media: text("media"), mediaMetadata: text("mediaMetadata"), license: varchar("license", { length: 500 }), sourceUrl: text("sourceUrl"), hidden: int("hidden").default(0).notNull(), allowDownloads: int("allowDownloads").default(0).notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(), actor: varchar("actor", { length: 320 }).notNull(), entityType: varchar("entityType", { length: 64 }).notNull(), entityKey: varchar("entityKey", { length: 191 }).notNull(), action: varchar("action", { length: 64 }).notNull(), details: text("details"), createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const notificationTemplates = mysqlTable("notification_templates", {
  id: int("id").autoincrement().primaryKey(), eventKey: varchar("eventKey", { length: 64 }).notNull().unique(), title: varchar("title", { length: 160 }).notNull(), message: text("message").notNull(), severity: mysqlEnum("severity", ["info", "success", "warning", "urgent"]).default("info").notNull(), enabled: int("enabled").default(1).notNull(), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(), eventKey: varchar("eventKey", { length: 64 }).notNull(), title: varchar("title", { length: 160 }).notNull(), message: text("message").notNull(), severity: mysqlEnum("severity", ["info", "success", "warning", "urgent"]).default("info").notNull(), recipient: varchar("recipient", { length: 64 }).default("owner").notNull(), readAt: timestamp("readAt"), createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const backupJobs = mysqlTable("backup_jobs", {
  id: int("id").autoincrement().primaryKey(), name: varchar("name", { length: 120 }).notNull().unique(), scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }), lastRunAt: timestamp("lastRunAt"), lastStatus: varchar("lastStatus", { length: 32 }), lastError: text("lastError"), lastObjectKey: varchar("lastObjectKey", { length: 500 }), updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type BehanceProject = typeof behanceProjects.$inferSelect;
export type BehanceSyncJob = typeof behanceSyncJobs.$inferSelect;
export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type TrafficEvent = typeof trafficEvents.$inferSelect;
export type MediaDownload = typeof mediaDownloads.$inferSelect;
export type MediaDownloadEvent = typeof mediaDownloadEvents.$inferSelect;
export type PortfolioProjectOverride = typeof portfolioProjectOverrides.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type BackupJob = typeof backupJobs.$inferSelect;
