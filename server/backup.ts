import { createCipheriv, randomBytes } from "node:crypto";
import { getDb } from "./db";
import { auditLogs, behanceProjects, behanceSyncJobs, notificationTemplates, notifications, portfolioProjectOverrides, quoteRequests, trafficEvents, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

function encryptionKey() {
  const raw = ENV.backupEncryptionKey;
  if (!/^[a-f0-9]{64}$/i.test(raw)) throw new Error("BACKUP_ENCRYPTION_KEY must be a 64-character hexadecimal key");
  return Buffer.from(raw, "hex");
}

export function validateBackupEncryptionKey() {
  encryptionKey();
  return true;
}

export async function createEncryptedBackup() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const snapshot = {
    format: "deva-braga-portfolio-backup-v1",
    createdAt: new Date().toISOString(),
    tables: {
      users: await db.select().from(users),
      behanceProjects: await db.select().from(behanceProjects),
      behanceSyncJobs: await db.select().from(behanceSyncJobs),
      quoteRequests: await db.select().from(quoteRequests),
      trafficEvents: await db.select().from(trafficEvents),
      portfolioProjectOverrides: await db.select().from(portfolioProjectOverrides),
      auditLogs: await db.select().from(auditLogs),
      notificationTemplates: await db.select().from(notificationTemplates),
      notifications: await db.select().from(notifications),
    },
  };
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(snapshot), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { version: 1, algorithm: "aes-256-gcm", iv: iv.toString("base64"), tag: tag.toString("base64"), ciphertext: encrypted.toString("base64") };
}
