import { describe, expect, it } from "vitest";
import { buildDownloadsCsv, buildQuotesCsv } from "./reportExport";

describe("buildQuotesCsv", () => {
  it("exports headers and escapes user-provided content safely", () => {
    const csv = buildQuotesCsv([{ id: 1, name: 'Deva "Braga"', email: "oi@example.com", phone: null, message: "Olá,\nquero um orçamento", status: "new", createdAt: "2026-09-16T12:00:00.000Z" }]);
    expect(csv.startsWith("\uFEFF\"ID\",\"Nome\",\"E-mail\"")).toBe(true);
    expect(csv).toContain('"Deva ""Braga"""');
    expect(csv).toContain('"Olá, quero um orçamento"');
  });
});

describe("buildDownloadsCsv", () => {
  it("gera cabeçalho, BOM e linhas de download", () => {
    const csv = buildDownloadsCsv([{ projectKey: "projeto-a", mediaIndex: 2, downloads: 7, updatedAt: "2026-09-17T04:00:00.000Z" }]);
    expect(csv.startsWith("\uFEFF\"Projeto\",\"Índice da mídia\",\"Downloads\"")).toBe(true);
    expect(csv).toContain('"projeto-a","2","7",');
  });

  it("escapa aspas e normaliza quebras de linha no identificador do projeto", () => {
    const csv = buildDownloadsCsv([{ projectKey: 'projeto, "especial"', mediaIndex: 0, downloads: 1, updatedAt: "2026-09-17T04:00:00.000Z" }]);
    expect(csv).toContain('"projeto, ""especial""","0","1",');
    expect(csv.split("\r\n")).toHaveLength(2);
  });
});
