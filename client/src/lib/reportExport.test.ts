import { describe, expect, it } from "vitest";
import { buildQuotesCsv } from "./reportExport";

describe("buildQuotesCsv", () => {
  it("exports headers and escapes user-provided content safely", () => {
    const csv = buildQuotesCsv([{ id: 1, name: 'Deva "Braga"', email: "oi@example.com", phone: null, message: "Olá,\nquero um orçamento", status: "new", createdAt: "2026-09-16T12:00:00.000Z" }]);
    expect(csv.startsWith("\uFEFFID,Nome,E-mail")).toBe(true);
    expect(csv).toContain('"Deva ""Braga"""');
    expect(csv).toContain('"Olá, quero um orçamento"');
  });
});
