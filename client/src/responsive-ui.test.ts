import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./index.css", import.meta.url), "utf8");
const home = readFileSync(new URL("./pages/Home.tsx", import.meta.url), "utf8");
const caseStudy = readFileSync(new URL("./pages/CaseStudy.tsx", import.meta.url), "utf8");

function cssHas(selector: string) {
  return css.includes(selector);
}

describe("responsive UI contracts", () => {
  it("keeps a safe viewport baseline and layered responsive breakpoints", () => {
    expect(cssHas("min-width: 320px")).toBe(true);
    expect(cssHas("overflow-x: hidden")).toBe(true);
    expect(cssHas("@media (max-width: 1024px)")).toBe(true);
    expect(cssHas("@media (max-width: 768px)")).toBe(true);
    expect(cssHas("@media (max-width: 480px)")).toBe(true);
  });

  it("protects keyboard focus and reduced-motion users", () => {
    expect(cssHas(":focus-visible")).toBe(true);
    expect(cssHas("@media (prefers-reduced-motion: reduce)")).toBe(true);
    expect(cssHas(".keyboard-navigation-hint.visible")).toBe(true);
  });

  it("keeps the light/dark readability contract and touch-sized controls", () => {
    expect(cssHas(".dark-mode .work-section")).toBe(true);
    expect(cssHas(".dark-mode .work-section .catalog-meta strong")).toBe(true);
    expect(cssHas(".case-study-share button { position: relative; min-width: 38px; min-height: 38px;")).toBe(true);
    expect(cssHas(".cookie-banner button { min-height: 40px;")).toBe(true);
  });

  it("keeps functional keyboard navigation and accessible share labels wired in source", () => {
    expect(home).toContain('event.key === "ArrowLeft" || event.key === "ArrowRight"');
    expect(home).toContain('event.key === "Escape"');
    expect(home).toContain('role="status" aria-live="polite"');
    expect(caseStudy).toContain('data-tooltip="WhatsApp"');
    expect(caseStudy).toContain('aria-label={copied ? "Link copiado" : "Copiar link"}');
  });

  it("keeps gallery images lazy and exposes a reduced-motion back-to-top control", () => {
    expect(home).toContain("function CatalogImage");
    expect(home).toContain('src={src} alt={alt} loading="lazy" decoding="async"');
    expect(home).toContain('className="image-skeleton"');
    expect(home).toContain('className="back-to-top"');
    expect(home).toContain('aria-label="Voltar ao topo"');
    expect(home).toContain('prefers-reduced-motion: reduce');
    expect(cssHas(".back-to-top:hover, .back-to-top:focus-visible")).toBe(true);
    expect(cssHas("@keyframes back-to-top-in")).toBe(true);
  });

  it("keeps back-to-top actions available inside work surfaces and case studies", () => {
    expect(home).toContain('className="project-back-to-top"');
    expect(home).toContain('aria-label="Voltar ao topo do trabalho"');
    expect(home).toContain('closest<HTMLElement>(".project-view")');
    expect(caseStudy).toContain('className="back-to-top case-study-back-to-top"');
    expect(caseStudy).toContain('aria-label="Voltar ao topo do estudo de caso"');
  });

  it("keeps the requested green caption and high-contrast header treatment", () => {
    expect(home).toContain("Deva Braga / Fotógrafo e Designer Gráfico");
    expect(cssHas(".statement-portrait figcaption { color: var(--acid)" )).toBe(true);
    expect(cssHas(".topbar { color: #fff" )).toBe(true);
    expect(cssHas("mix-blend-mode: normal")).toBe(true);
  });
});
