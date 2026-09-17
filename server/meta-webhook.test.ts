import crypto from "node:crypto";
import { describe, expect, it } from "vitest";

describe("Meta WhatsApp webhook configuration", () => {
  it("accepts the configured Meta access token through the Graph API", async () => {
    const token = process.env.META_WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
    expect(token, "META_WHATSAPP_ACCESS_TOKEN is not configured").toBeTruthy();
    expect(phoneNumberId, "META_WHATSAPP_PHONE_NUMBER_ID is not configured").toBeTruthy();
    const response = await fetch(`https://graph.facebook.com/v23.0/${phoneNumberId}`, { headers: { Authorization: `Bearer ${token}` } });
    expect(response.ok, `Meta Graph API returned ${response.status}`).toBe(true);
  }, 20_000);

  it("can compute a deterministic X-Hub-Signature-256 with the configured App Secret", () => {
    const appSecret = process.env.META_APP_SECRET;
    expect(appSecret, "META_APP_SECRET is not configured").toBeTruthy();
    const payload = Buffer.from(JSON.stringify({ object: "whatsapp_business_account", entry: [] }));
    const signature = `sha256=${crypto.createHmac("sha256", appSecret as string).update(payload).digest("hex")}`;
    expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);
  });
});
