import crypto from "node:crypto";
import type { Express, Request, Response } from "express";
import { ENV } from "./_core/env";
import { updateWhatsAppDeliveryStatus } from "./db";

type StatusPayload = {
  object?: string;
  entry?: Array<{ changes?: Array<{ value?: { statuses?: Array<{ id?: string; status?: string; timestamp?: string; errors?: Array<{ code?: number; title?: string; message?: string }> }> } }> }>;
};

function isValidSignature(req: Request) {
  if (!ENV.metaAppSecret) return process.env.NODE_ENV !== "production";
  const received = req.header("x-hub-signature-256") ?? "";
  const expected = `sha256=${crypto.createHmac("sha256", ENV.metaAppSecret).update((req as Request & { rawBody?: Buffer }).rawBody ?? Buffer.from(JSON.stringify(req.body))).digest("hex")}`;
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

export function registerMetaWebhook(app: Express) {
  app.get("/api/webhooks/meta/whatsapp", (req: Request, res: Response) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && ENV.metaWebhookVerifyToken && token === ENV.metaWebhookVerifyToken) return res.status(200).send(String(challenge ?? ""));
    return res.sendStatus(403);
  });

  app.post("/api/webhooks/meta/whatsapp", async (req: Request, res: Response) => {
    if (!isValidSignature(req)) return res.sendStatus(403);
    const payload = req.body as StatusPayload;
    if (payload.object !== "whatsapp_business_account") return res.sendStatus(200);
    let updated = 0;
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        for (const status of change.value?.statuses ?? []) {
          if (!status.id || !status.status) continue;
          const error = status.errors?.[0];
          updated += await updateWhatsAppDeliveryStatus({
            providerMessageId: status.id,
            providerStatus: status.status,
            errorCode: error?.code ? `meta_${error.code}` : undefined,
            details: error?.title ?? error?.message,
            providerUpdatedAt: status.timestamp ? new Date(Number(status.timestamp) * 1000) : new Date(),
          });
        }
      }
    }
    return res.status(200).json({ ok: true, updated });
  });
}
