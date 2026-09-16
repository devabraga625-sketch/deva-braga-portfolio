import type { Request, Response } from "express";
import { createEncryptedBackup } from "./backup";
import { getBackupJobByTaskUid, updateBackupJob } from "./db";
import { storagePut } from "./storage";
import { sdk } from "./_core/sdk";

export async function handleEncryptedBackup(req: Request, res: Response) {
  const context = { url: req.originalUrl, timestamp: new Date().toISOString() };
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const job = await getBackupJobByTaskUid(user.taskUid);
    if (!job) return res.json({ ok: true, skipped: "orphan" });
    try {
      const encrypted = await createEncryptedBackup();
      const object = await storagePut(`backups/${new Date().toISOString().slice(0, 10)}.json.enc`, JSON.stringify(encrypted), "application/octet-stream");
      await updateBackupJob(job.name, { lastRunAt: new Date(), lastStatus: "success", lastError: null, lastObjectKey: object.key });
      return res.json({ ok: true, objectKey: object.key });
    } catch (error) {
      await updateBackupJob(job.name, { lastRunAt: new Date(), lastStatus: "failed", lastError: String(error) });
      throw error;
    }
  } catch (error) {
    return res.status(500).json({ error: String(error), context });
  }
}
