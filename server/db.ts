import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, User, behanceProjects, behanceSyncJobs, users } from "../drizzle/schema";
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
