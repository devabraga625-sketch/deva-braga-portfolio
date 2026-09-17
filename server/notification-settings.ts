import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { notificationProviderSettings } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { getDb } from "./db";

const SETTINGS_ID = 1;
const secretKey = () => createHash("sha256").update(ENV.cookieSecret || "deva-braga-notification-settings").digest();

export function encryptProviderSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secretKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decryptProviderSecret(payload: string) {
  const [ivValue, tagValue, ciphertextValue] = payload.split(".");
  if (!ivValue || !tagValue || !ciphertextValue) throw new Error("Invalid provider secret payload");
  const decipher = createDecipheriv("aes-256-gcm", secretKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextValue, "base64url")), decipher.final()]).toString("utf8");
}

export async function getStoredNotificationProviderSettings() {
  const db = await getDb();
  if (!db) return undefined;
  try {
    const result = await db.select().from(notificationProviderSettings).where(eq(notificationProviderSettings.id, SETTINGS_ID)).limit(1);
    return result[0];
  } catch (error) {
    console.warn("[Notifications] Stored provider settings unavailable:", error instanceof Error ? error.message : "unknown error");
    return undefined;
  }
}

export async function saveNotificationProviderSettings(input: {
  smtpHost?: string; smtpPort?: number; smtpUser?: string; smtpPassword?: string; smtpFrom?: string; notificationEmail?: string;
  metaAccessToken?: string; metaPhoneNumberId?: string; metaBusinessAccountId?: string; metaTo?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_URL is not configured");
  const existing = await getStoredNotificationProviderSettings();
  const values = {
    id: SETTINGS_ID,
    smtpHost: input.smtpHost ?? existing?.smtpHost ?? null,
    smtpPort: input.smtpPort ?? existing?.smtpPort ?? null,
    smtpUser: input.smtpUser ?? existing?.smtpUser ?? null,
    smtpPasswordEncrypted: input.smtpPassword ? encryptProviderSecret(input.smtpPassword) : existing?.smtpPasswordEncrypted ?? null,
    smtpFrom: input.smtpFrom ?? existing?.smtpFrom ?? null,
    notificationEmail: input.notificationEmail ?? existing?.notificationEmail ?? null,
    metaAccessTokenEncrypted: input.metaAccessToken ? encryptProviderSecret(input.metaAccessToken) : existing?.metaAccessTokenEncrypted ?? null,
    metaPhoneNumberId: input.metaPhoneNumberId ?? existing?.metaPhoneNumberId ?? null,
    metaBusinessAccountId: input.metaBusinessAccountId ?? existing?.metaBusinessAccountId ?? null,
    metaTo: input.metaTo ?? existing?.metaTo ?? null,
  };
  await db.insert(notificationProviderSettings).values(values).onDuplicateKeyUpdate({ set: { ...values, updatedAt: new Date() } });
}

export async function getNotificationProviderConfig() {
  const stored = await getStoredNotificationProviderSettings();
  return {
    smtpHost: stored?.smtpHost ?? ENV.smtpHost,
    smtpPort: stored?.smtpPort ?? ENV.smtpPort,
    smtpSecure: ENV.smtpSecure,
    smtpUser: stored?.smtpUser ?? ENV.smtpUser,
    smtpPassword: stored?.smtpPasswordEncrypted ? decryptProviderSecret(stored.smtpPasswordEncrypted) : ENV.smtpPassword,
    smtpFrom: stored?.smtpFrom ?? ENV.smtpFrom,
    notificationEmail: stored?.notificationEmail ?? ENV.notificationEmail,
    metaWhatsAppAccessToken: stored?.metaAccessTokenEncrypted ? decryptProviderSecret(stored.metaAccessTokenEncrypted) : ENV.metaWhatsAppAccessToken,
    metaWhatsAppPhoneNumberId: stored?.metaPhoneNumberId ?? ENV.metaWhatsAppPhoneNumberId,
    metaWhatsAppBusinessAccountId: stored?.metaBusinessAccountId ?? ENV.metaWhatsAppBusinessAccountId,
    metaWhatsAppTo: stored?.metaTo ?? ENV.metaWhatsAppTo,
  };
}

export async function getNotificationProviderStatus() {
  const stored = await getStoredNotificationProviderSettings();
  return {
    smtpConfigured: Boolean(stored?.smtpPasswordEncrypted || ENV.smtpPassword) && Boolean(stored?.smtpUser ?? ENV.smtpUser),
    smtpUser: stored?.smtpUser ?? ENV.smtpUser,
    notificationEmail: stored?.notificationEmail ?? ENV.notificationEmail,
    metaConfigured: Boolean(stored?.metaAccessTokenEncrypted || ENV.metaWhatsAppAccessToken) && Boolean(stored?.metaPhoneNumberId ?? ENV.metaWhatsAppPhoneNumberId),
    metaPhoneNumberId: stored?.metaPhoneNumberId ?? ENV.metaWhatsAppPhoneNumberId,
    metaTo: stored?.metaTo ?? ENV.metaWhatsAppTo,
    secretsStoredEncrypted: Boolean(stored?.smtpPasswordEncrypted || stored?.metaAccessTokenEncrypted),
  };
}
