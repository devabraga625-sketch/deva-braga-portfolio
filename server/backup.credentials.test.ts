import { describe, expect, it } from "vitest";
import { validateBackupEncryptionKey } from "./backup";

describe("encrypted backup credentials", () => {
  it("accepts the configured AES-256 hexadecimal key", () => {
    expect(validateBackupEncryptionKey()).toBe(true);
  });
});
