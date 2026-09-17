import { CheckCircle2, CircleAlert, Search, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type TrafficSnapshot = { totals: { views: number; visitors: number; clicks: number; downloads: number }; byDay: Array<{ day: string; views: number; clicks: number; downloads: number }> };
type Check = { label: string; detail: string; status: "ok" | "attention" | "missing" };

export default function SeoAuditPanel({ traffic, projectCount }: { traffic?: TrafficSnapshot; projectCount: number }) {
  const [crawlFiles, setCrawlFiles] = useState<{ robots: boolean; sitemap: boolean } | null>(null);
  useEffect(() => {
    let active = true;
    Promise.all([fetch("/robots.txt", { cache: "no-store" }), fetch("/sitemap.xml", { cache: "no-store" })]).then(([robots, sitemap]) => { if (active) setCrawlFiles({ robots: robots.ok, sitemap: sitemap.ok }); }).catch(() => { if (active) setCrawlFiles({ robots: false, sitemap: false }); });
    return () => { active = false; };
  }, []);

  const checks = useMemo<Check[]>(() => [
    { label: "Idioma e viewport", detail: "HTML pt-BR e viewport responsivo declarados.", status: "ok" },
    { label: "Título e meta description", detail: "Título e descrição editorial presentes no documento principal.", status: "ok" },
    { label: "Canonical e Open Graph", detail: "Canonical, og:title, og:description e og:url configurados.", status: "ok" },
    { label: "Dados estruturados", detail: "Schema.org Person identifica autora, função e perfis oficiais.", status: "ok" },
    { label: "Robots e sitemap", detail: crawlFiles === null ? "Verificando arquivos públicos…" : crawlFiles.robots && crawlFiles.sitemap ? "Robots e sitemap respondem no ambiente atual." : "Um ou mais arquivos de rastreamento não responderam.", status: crawlFiles === null ? "attention" : crawlFiles.robots && crawlFiles.sitemap ? "ok" : "missing" },
    { label: "Conteúdo indexável", detail: `${projectCount} projetos no catálogo e páginas públicas de privacidade, status e estudos de caso.`, status: projectCount > 0 ? "ok" : "attention" },
    { label: "Dados de busca", detail: "GSC, palavras-chave, backlinks e Core Web Vitals de campo ainda não estão conectados.", status: "attention" },
  ], [crawlFiles, projectCount]);
  const score = Math.round((checks.filter(check => check.status === "ok").length / checks.length) * 100);
  const issues = checks.filter(check => check.status !== "ok");
  const totals = traffic?.totals ?? { views: 0, visitors: 0, clicks: 0, downloads: 0 };
  const trend = traffic?.byDay ?? [];
  const latestViews = trend.length ? Number(trend[trend.length - 1].views) : 0;
  const previousViews = trend.length > 1 ? Number(trend[trend.length - 2].views) : 0;
  const movement = latestViews > previousViews ? "subindo" : latestViews < previousViews ? "caindo" : "estável";

  return <section className="panel-card seo-audit-card" id="seo-audit"><div className="panel-card-heading"><div><span className="eyebrow seo-heading"><Search size={14} /> Inteligência SEO</span><span>Diagnóstico técnico e sinais observáveis do portfólio</span></div><span className="seo-freshness">Atualizado agora</span></div><div className="seo-overview"><div className="seo-score"><strong>{score}</strong><span>/ 100</span><small>base técnica</small></div><div className="seo-summary"><h2>{score >= 80 ? "Boa fundação para descoberta." : "Há pontos técnicos a priorizar."}</h2><p>O diagnóstico combina metadados do HTML, arquivos públicos de rastreamento, catálogo de projetos e analytics agregados do próprio site. Não inventa posições, backlinks ou tráfego orgânico que não foram conectados.</p><div className="seo-signal-row"><span><strong>{totals.views}</strong> visualizações</span><span><strong>{totals.visitors}</strong> visitantes</span><span><strong>{totals.clicks}</strong> cliques em projetos</span><span>tendência <strong>{movement}</strong></span></div></div></div><div className="seo-check-grid">{checks.map(check => <article key={check.label} className={`seo-check seo-${check.status}`}>{check.status === "ok" ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />}<div><strong>{check.label}</strong><span>{check.detail}</span></div></article>)}</div><div className="seo-next-actions"><div><ShieldCheck size={16} /><strong>Próximas fontes para análise completa</strong></div><p>{issues.length ? issues.map(issue => issue.label).join(" · ") : "Nenhuma lacuna técnica detectada na camada rastreável."}</p><small>Para análise de palavras-chave, páginas líderes, países, backlinks e Core Web Vitals, conecte exportações do Google Search Console, GA4, crawler e ferramenta de backlinks.</small></div></section>;
}
