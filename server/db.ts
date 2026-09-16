import { count, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, User, auditLogs, behanceProjects, behanceSyncJobs, portfolioProjectOverrides, quoteRequests, trafficEvents, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export type BehanceProjectInput = {
  projectKey: string; title: string; sourceUrl: string; cover?: string; description?: string; publishedAt?: Date;
};

export async function upsertBehanceProjects(projects: BehanceProjectInput[]) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_URL is not configured");
  for (const project of projects) {
    await db.insert(behanceProjects).values({
      projectKey: project.projectKey, title: project.title, sourceUrl: project.sourceUrl,
      cover: project.cover ?? null, description: project.description ?? null, publishedAt: project.publishedAt ?? null,
    }).onDuplicateKeyUpdate({ set: {
      title: project.title, sourceUrl: project.sourceUrl, cover: project.cover ?? null,
      description: project.description ?? null, publishedAt: project.publishedAt ?? null, updatedAt: new Date(),
    } });
  }
}

export async function listBehanceProjects() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(behanceProjects).orderBy(desc(behanceProjects.publishedAt), desc(behanceProjects.createdAt));
}

export async function getBehanceSyncJob(name: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(behanceSyncJobs).where(eq(behanceSyncJobs.name, name)).limit(1);
  return result[0];
}

export async function ensureBehanceSyncJob(name: string) {
  const db = await getDb(); if (!db) throw new Error("DATABASE_URL is not configured");
  await db.insert(behanceSyncJobs).values({ name }).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
  return getBehanceSyncJob(name);
}

export async function updateBehanceSyncJob(name: string, values: Partial<typeof behanceSyncJobs.$inferInsert>) {
  const db = await getDb(); if (!db) throw new Error("DATABASE_URL is not configured");
  await db.update(behanceSyncJobs).set({ ...values, updatedAt: new Date() }).where(eq(behanceSyncJobs.name, name));
}

export async function createQuoteRequest(input: { name: string; email: string; phone?: string; message: string }) {
  const db = await getDb(); if (!db) throw new Error("DATABASE_URL is not configured");
  await db.insert(quoteRequests).values({ name: input.name, email: input.email, phone: input.phone ?? null, message: input.message, consent: 1, status: "pending" });
}

export async function listQuoteRequests() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(quoteRequests).orderBy(desc(quoteRequests.createdAt)).limit(100);
}

export async function updateQuoteRequestStatus(id: number, status: "pending" | "responded" | "completed") {
  const db = await getDb(); if (!db) throw new Error("DATABASE_URL is not configured");
  await db.update(quoteRequests).set({ status, }).where(eq(quoteRequests.id, id));
}

export async function recordTrafficEvent(input: { eventType: string; path: string; projectKey?: string; visitorId: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(trafficEvents).values({ eventType: input.eventType, path: input.path, projectKey: input.projectKey ?? null, visitorId: input.visitorId });
}

export async function getTrafficSummary(days = 7) {
  const db = await getDb(); if (!db) return { totals: { views: 0, clicks: 0, visitors: 0 }, byDay: [], topProjects: [] };
  const [totals, visitors, byDay, topProjects] = await Promise.all([
    db.select({ views: count(sql`CASE WHEN ${trafficEvents.eventType} = 'page_view' THEN 1 END`), clicks: count(sql`CASE WHEN ${trafficEvents.eventType} = 'project_click' THEN 1 END`) }).from(trafficEvents),
    db.select({ visitors: sql<number>`COUNT(DISTINCT ${trafficEvents.visitorId})` }).from(trafficEvents),
    db.select({ day: sql<string>`DATE_FORMAT(${trafficEvents.createdAt}, '%Y-%m-%d')`, views: count(sql`CASE WHEN ${trafficEvents.eventType} = 'page_view' THEN 1 END`), clicks: count(sql`CASE WHEN ${trafficEvents.eventType} = 'project_click' THEN 1 END`) }).from(trafficEvents).where(sql`${trafficEvents.createdAt} >= DATE_SUB(NOW(), INTERVAL ${sql.raw(String(days))} DAY)`).groupBy(sql`DATE_FORMAT(${trafficEvents.createdAt}, '%Y-%m-%d')`).orderBy(sql`DATE_FORMAT(${trafficEvents.createdAt}, '%Y-%m-%d')`),
    db.select({ projectKey: trafficEvents.projectKey, clicks: count() }).from(trafficEvents).where(eq(trafficEvents.eventType, "project_click")).groupBy(trafficEvents.projectKey).orderBy(desc(count())).limit(8),
  ]);
  return { totals: { views: Number(totals[0]?.views ?? 0), clicks: Number(totals[0]?.clicks ?? 0), visitors: Number(visitors[0]?.visitors ?? 0) }, byDay, topProjects };
}

export async function getProjectAccessCounts() {
  const db = await getDb(); if (!db) return [];
  return db.select({ projectKey: trafficEvents.projectKey, accesses: count() }).from(trafficEvents).where(eq(trafficEvents.eventType, "project_click")).groupBy(trafficEvents.projectKey).orderBy(desc(count())).limit(200);
}

export async function listPortfolioProjectOverrides() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(portfolioProjectOverrides);
}

export async function getPortfolioProjectOverride(projectKey: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(portfolioProjectOverrides).where(eq(portfolioProjectOverrides.projectKey, projectKey)).limit(1);
  return result[0];
}

export async function upsertPortfolioProjectOverride(input: { projectKey: string; title?: string; description?: string; year?: string; thumbnail?: string; media?: string[]; sourceUrl?: string; hidden?: boolean }) {
  const db = await getDb(); if (!db) throw new Error("DATABASE_URL is not configured");
  await db.insert(portfolioProjectOverrides).values({ projectKey: input.projectKey, title: input.title ?? null, description: input.description ?? null, year: input.year ?? null, thumbnail: input.thumbnail ?? null, media: input.media ? JSON.stringify(input.media) : null, sourceUrl: input.sourceUrl ?? null, hidden: input.hidden ? 1 : 0 }).onDuplicateKeyUpdate({ set: { title: input.title ?? null, description: input.description ?? null, year: input.year ?? null, thumbnail: input.thumbnail ?? null, media: input.media ? JSON.stringify(input.media) : null, sourceUrl: input.sourceUrl ?? null, hidden: input.hidden ? 1 : 0, updatedAt: new Date() } });
}

export async function deletePortfolioProjectOverride(projectKey: string) {
  const db = await getDb(); if (!db) throw new Error("DATABASE_URL is not configured");
  await db.delete(portfolioProjectOverrides).where(eq(portfolioProjectOverrides.projectKey, projectKey));
}

export async function setPortfolioProjectAsset(projectKey: string, kind: "thumbnail" | "media", url: string) {
  const db = await getDb(); if (!db) throw new Error("DATABASE_URL is not configured");
  const existing = await getPortfolioProjectOverride(projectKey);
  if (kind === "thumbnail") {
    if (existing) await db.update(portfolioProjectOverrides).set({ thumbnail: url, updatedAt: new Date() }).where(eq(portfolioProjectOverrides.projectKey, projectKey));
    else await db.insert(portfolioProjectOverrides).values({ projectKey, thumbnail: url });
    return;
  }
  const media = existing?.media ? JSON.parse(existing.media) as string[] : [];
  media.push(url);
  if (existing) await db.update(portfolioProjectOverrides).set({ media: JSON.stringify(media), updatedAt: new Date() }).where(eq(portfolioProjectOverrides.projectKey, projectKey));
  else await db.insert(portfolioProjectOverrides).values({ projectKey, media: JSON.stringify(media) });
}

export async function recordAuditLog(input: { actor: string; entityType: string; entityKey: string; action: string; details?: string }) {
  const db = await getDb(); if (!db) return;
  await db.insert(auditLogs).values({ actor: input.actor, entityType: input.entityType, entityKey: input.entityKey, action: input.action, details: input.details ?? null });
}

export async function listAuditLogs() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(250);
}
