import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import QRCode from "qrcode";
import { generateSecret, generateURI, verify } from "otplib";
import { ENV } from "./_core/env";

const ISSUER = "Deva Braga Portfolio";
const WINDOW_MS = 5 * 60_000;
const MAX_ATTEMPTS = 8;
const attempts = new Map<string, { startedAt: number; count: number }>();

function key() {
  if (!ENV.cookieSecret) throw new Error("JWT_SECRET is required for 2FA secret encryption");
  return createHash("sha256").update(ENV.cookieSecret).digest();
}

export function encryptTwoFactorSecret(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return JSON.stringify({ v: 1, iv: iv.toString("base64url"), tag: cipher.getAuthTag().toString("base64url"), data: encrypted.toString("base64url") });
}

export function decryptTwoFactorSecret(payload: string) {
  const parsed = JSON.parse(payload) as { v: number; iv: string; tag: string; data: string };
  if (parsed.v !== 1) throw new Error("Unsupported 2FA secret version");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(parsed.iv, "base64url"));
  decipher.setAuthTag(Buffer.from(parsed.tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(parsed.data, "base64url")), decipher.final()]).toString("utf8");
}

export async function createTwoFactorEnrollment(label: string) {
  const secret = generateSecret();
  const uri = generateURI({ issuer: ISSUER, label, secret });
  const qrCode = await QRCode.toDataURL(uri, { width: 260, margin: 1, errorCorrectionLevel: "M" });
  return { secret, qrCode, uri };
}

export async function verifyTwoFactorCode(openId: string, secret: string, token: string) {
  const now = Date.now();
  const current = attempts.get(openId);
  if (!current || now - current.startedAt >= WINDOW_MS) attempts.set(openId, { startedAt: now, count: 1 });
  else {
    current.count += 1;
    if (current.count > MAX_ATTEMPTS) return { valid: false, rateLimited: true };
  }
  const result = await verify({ secret, token });
  if (result.valid) attempts.delete(openId);
  return { valid: result.valid, rateLimited: false };
}

export function resetTwoFactorAttemptsForTests() {
  attempts.clear();
}
