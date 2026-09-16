import { describe, expect, it } from "vitest";
import { z } from "zod";

const periodInput = z.object({ days: z.union([z.literal(7), z.literal(30)]).default(7) });

describe("analytics period input", () => {
  it("accepts the supported 7 and 30 day periods", () => {
    expect(periodInput.parse({})).toEqual({ days: 7 });
    expect(periodInput.parse({ days: 30 })).toEqual({ days: 30 });
  });

  it("rejects arbitrary periods", () => {
    expect(() => periodInput.parse({ days: 14 })).toThrow();
  });
});
