import { describe, expect, it } from "vitest";
import { verifySmtpConnection } from "./external-notifications";

describe("notification provider secrets", () => {
  it("has the SMTP and Meta WhatsApp configuration available", async () => {
    expect(process.env.SMTP_HOST).toBe("smtp.gmail.com");
    expect(process.env.SMTP_PORT).toBe("587");
    expect(process.env.SMTP_USER).toMatch(/@gmail\.com$/);
    expect(process.env.SMTP_PASSWORD).toBeTruthy();
    expect(process.env.META_WHATSAPP_ACCESS_TOKEN).toMatch(/^EAA/);
    expect(process.env.META_WHATSAPP_PHONE_NUMBER_ID).toBeTruthy();

    const response = await fetch(`https://graph.facebook.com/v23.0/${process.env.META_WHATSAPP_PHONE_NUMBER_ID}?fields=id`, {
      headers: { Authorization: `Bearer ${process.env.META_WHATSAPP_ACCESS_TOKEN}` },
    });
    expect(response.ok, `Meta API returned ${response.status}`).toBe(true);
  }, 20_000);

  it("authenticates to Gmail SMTP with STARTTLS without sending a message", async () => {
    await expect(verifySmtpConnection()).resolves.toBe(true);
  }, 30_000);
});
