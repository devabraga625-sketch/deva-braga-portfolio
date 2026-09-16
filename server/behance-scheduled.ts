import type { Request, Response } from "express";
import { getBehanceSyncJob } from "./db";
import { JOB_NAME, syncPublicBehanceProjects } from "./behance-sync";
import { sdk } from "./_core/sdk";

export async function handleBehanceSync(req: Request, res: Response) {
  const context = { url: req.originalUrl, timestamp: new Date().toISOString() };
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const job = await getBehanceSyncJob(JOB_NAME);
    if (!job || job.scheduleCronTaskUid !== user.taskUid) return res.json({ ok: true, skipped: "orphan" });
    const result = await syncPublicBehanceProjects();
    return res.json({ ok: true, ...result });
  } catch (error) {
    return res.status(500).json({ error: String(error), context });
  }
}
