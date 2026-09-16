import { describe, expect, it } from "vitest";
import { z } from "zod";

const leadStatus = z.enum(["pending", "responded", "completed"]);

describe("lead status workflow", () => {
  it("accepts the supported management states", () => {
    expect(["pending", "responded", "completed"].map(value => leadStatus.parse(value))).toEqual(["pending", "responded", "completed"]);
  });

  it("rejects legacy or unknown states", () => {
    expect(() => leadStatus.parse("new")).toThrow();
    expect(() => leadStatus.parse("archived")).toThrow();
  });
});
