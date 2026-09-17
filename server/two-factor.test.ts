import { describe, expect, it } from "vitest";
import { generate, generateSecret } from "otplib";
import { decryptTwoFactorSecret, encryptTwoFactorSecret, resetTwoFactorAttemptsForTests, verifyTwoFactorCode } from "./two-factor";

describe("TOTP two-factor authentication", () => {
  it("encrypts and decrypts the authenticator secret", () => {
    const secret = generateSecret();
    expect(decryptTwoFactorSecret(encryptTwoFactorSecret(secret))).toBe(secret);
  });

  it("accepts a valid authenticator code and rejects an invalid one", async () => {
    resetTwoFactorAttemptsForTests();
    const secret = generateSecret();
    const code = await generate({ secret });
    expect((await verifyTwoFactorCode("test-user", secret, code)).valid).toBe(true);
    expect((await verifyTwoFactorCode("test-user", secret, "000000")).valid).toBe(false);
  });
});
