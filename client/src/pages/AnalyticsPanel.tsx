import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { buildQuotesCsv } from "@/lib/reportExport";

export default function AnalyticsPanel() {
  const { user, loading, isAuthenticated } = useAuth();
  const [days, setDays] = useState<7 | 30>(7);
  const [metric, setMetric] = useState<"views" | "clicks">("views");
  const summary = trpc.analytics.summary.useQuery({ days }, { enabled: isAuthenticated, refetchInterval: 30_000 });
  const leads = trpc.analytics.leads.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 30_000 });

  if (loading) return <main className="panel-shell"><p className="eyebrow">Carregando painel…</p></main>;
  if (!isAuthenticated) return <main className="panel-shell"><p className="eyebrow">Acesso privado</p><h1>Painel do portfólio</h1><p>Entre com a conta proprietária para ver métricas e pedidos.</p><button onClick={() => startLogin()}>Entrar</button></main>;
  if (user?.role !== "admin") return <main className="panel-shell"><p className="eyebrow">Acesso restrito</p><h1>Este painel é privado.</h1></main>;

  const data = summary.data;
  const values = data?.byDay.map(day => Number(day[metric])) ?? [];
  const maxValue = Math.max(...values, 1);
  const exportLeadsCsv = () => {
    const blob = new Blob([buildQuotesCsv(leads.data ?? [])], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `pedidos-orcamento-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
  };
  return <main className="panel-shell" id="analytics-report">
    <header className="panel-header"><div><p className="eyebrow">Deva Braga / analytics</p><h1>O que está acontecendo.</h1><p className="panel-subtitle">Dados agregados, atualizados automaticamente a cada 30 segundos.</p></div><div className="panel-actions"><a href="/">Voltar ao site ↗</a><button className="print-button" onClick={() => window.print()}>Exportar relatório PDF ↓</button></div></header>
    <section className="metric-grid"><article><span>Visualizações totais</span><strong>{data?.totals.views ?? "—"}</strong></article><article><span>Visitantes únicos</span><strong>{data?.totals.visitors ?? "—"}</strong></article><article><span>Cliques em projetos</span><strong>{data?.totals.clicks ?? "—"}</strong></article></section>
    <section className="panel-card chart-card"><div className="panel-card-heading"><div><span className="eyebrow">Desempenho diário</span><p className="chart-caption">{metric === "views" ? "Visualizações de página" : "Aberturas de projetos"}</p></div><div className="chart-controls"><div className="segmented"><button className={days === 7 ? "active" : ""} onClick={() => setDays(7)}>7 dias</button><button className={days === 30 ? "active" : ""} onClick={() => setDays(30)}>30 dias</button></div><div className="segmented"><button className={metric === "views" ? "active" : ""} onClick={() => setMetric("views")}>Visitas</button><button className={metric === "clicks" ? "active" : ""} onClick={() => setMetric("clicks")}>Cliques</button></div></div></div><div className="bar-chart interactive-chart">{(data?.byDay ?? []).map(day => <button className="bar-column" key={day.day} title={`${day.day}: ${day[metric]}`}><span className="bar-value">{day[metric]}</span><div className="bar" style={{ height: `${Math.max(6, Number(day[metric]) / maxValue * 100)}%` }} /><small>{day.day.slice(5)}</small></button>)}</div></section>
    <section className="panel-grid"><article className="panel-card"><div className="panel-card-heading"><span className="eyebrow">Projetos mais clicados</span><span>Período selecionado</span></div><ol className="rank-list">{(data?.topProjects ?? []).map(item => <li key={item.projectKey ?? "unknown"}><span>{item.projectKey ?? "Página geral"}</span><strong>{item.clicks}</strong></li>)}</ol></article><article className="panel-card privacy-card"><span className="eyebrow">Privacidade por desenho</span><p>O painel usa eventos agregados e um identificador técnico aleatório. Não registra IP, conteúdo de formulário ou dados pessoais de visitantes que recusaram cookies.</p></article></section>
    <section className="panel-card leads-card"><div className="panel-card-heading"><div><span className="eyebrow">Pedidos de orçamento</span><span>{leads.data?.length ?? 0} registrados</span></div><button className="csv-button" onClick={exportLeadsCsv} disabled={!leads.data?.length}>Exportar CSV ↓</button></div><div className="leads-list">{(leads.data ?? []).map(lead => <article key={lead.id}><div><strong>{lead.name}</strong><span>{lead.email}{lead.phone ? ` · ${lead.phone}` : ""}</span></div><time>{new Date(lead.createdAt).toLocaleString("pt-BR")}</time><p>{lead.message}</p></article>)}</div></section>
  </main>;
}
