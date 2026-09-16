import { describe, expect, it } from "vitest";

const resendKey = process.env.RESEND_API_KEY;
const twilioSid = process.env.TWILIO_ACCOUNT_SID;
const twilioToken = process.env.TWILIO_AUTH_TOKEN;

describe("external notification credentials", () => {
  it("accepts the configured Resend API key", async () => {
    expect(resendKey, "RESEND_API_KEY is not configured").toBeTruthy();
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({}),
    });
    const detail = await response.text();
    expect(response.status, detail).not.toBe(401);
    expect(response.status, detail).not.toBe(403);
  }, 15_000);

  it("accepts the configured Twilio account credentials", async () => {
    expect(twilioSid, "TWILIO_ACCOUNT_SID is not configured").toBeTruthy();
    expect(twilioToken, "TWILIO_AUTH_TOKEN is not configured").toBeTruthy();
    const basic = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}.json`, {
      headers: { Authorization: `Basic ${basic}` },
    });
    const detail = await response.text();
    expect(response.status, detail).not.toBe(401);
    expect(response.status, detail).not.toBe(403);
  }, 15_000);
});
