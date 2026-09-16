import { describe, expect, it, beforeEach } from "vitest";
import { apiRateLimit, resetSecurityBucketsForTests } from "./_core/security";

describe("HTTP security hardening", () => {
  beforeEach(() => resetSecurityBucketsForTests());

  it("allows normal requests and blocks abusive bursts", () => {
    const req = { ip: "203.0.113.10", path: "/api/trpc/quoteRequests.create" } as any;
    const headers = new Map<string, string>();
    const res = { setHeader: (key: string, value: string) => headers.set(key, value), status: () => res, json: (body: unknown) => body } as any;
    let nextCalls = 0;
    const next = () => { nextCalls += 1; };
    for (let i = 0; i < 120; i += 1) apiRateLimit(req, res, next);
    expect(nextCalls).toBe(120);
    const blocked = apiRateLimit(req, res, next);
    expect(blocked).toBeDefined();
    expect(nextCalls).toBe(120);
    expect(headers.get("Retry-After")).toBeTruthy();
  });
});
