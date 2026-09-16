import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function AnalyticsPanel() {
  const { user, loading, isAuthenticated } = useAuth();
  const summary = trpc.analytics.summary.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 30_000 });
  const leads = trpc.analytics.leads.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 30_000 });
  if (loading) return <main className="panel-shell"><p className="eyebrow">Carregando painel…</p></main>;
  if (!isAuthenticated) return <main className="panel-shell"><p className="eyebrow">Acesso privado</p><h1>Painel do portfólio</h1><p>Entre com a conta proprietária para ver métricas e pedidos.</p><button onClick={() => startLogin()}>Entrar</button></main>;
  if (user?.role !== "admin") return <main className="panel-shell"><p className="eyebrow">Acesso restrito</p><h1>Este painel é privado.</h1></main>;
  const data = summary.data;
  const maxDay = Math.max(...(data?.byDay.map(day => Number(day.views)) ?? [1]), 1);
  return <main className="panel-shell">
    <header className="panel-header"><div><p className="eyebrow">Deva Braga / analytics</p><h1>O que está acontecendo.</h1></div><a href="/">Voltar ao site ↗</a></header>
    <section className="metric-grid"><article><span>Visualizações</span><strong>{data?.totals.views ?? "—"}</strong></article><article><span>Visitantes únicos</span><strong>{data?.totals.visitors ?? "—"}</strong></article><article><span>Cliques em projetos</span><strong>{data?.totals.clicks ?? "—"}</strong></article></section>
    <section className="panel-grid"><article className="panel-card"><div className="panel-card-heading"><span className="eyebrow">Últimos 7 dias</span><span>Atualização automática</span></div><div className="bar-chart">{(data?.byDay ?? []).map(day => <div className="bar-column" key={day.day}><div className="bar" style={{ height: `${Math.max(6, Number(day.views) / maxDay * 100)}%` }} /><small>{day.day.slice(5)}</small></div>)}</div></article><article className="panel-card"><div className="panel-card-heading"><span className="eyebrow">Projetos mais clicados</span></div><ol className="rank-list">{(data?.topProjects ?? []).map(item => <li key={item.projectKey ?? "unknown"}><span>{item.projectKey ?? "Página geral"}</span><strong>{item.clicks}</strong></li>)}</ol></article></section>
    <section className="panel-card leads-card"><div className="panel-card-heading"><span className="eyebrow">Pedidos de orçamento</span><span>{leads.data?.length ?? 0} registrados</span></div><div className="leads-list">{(leads.data ?? []).map(lead => <article key={lead.id}><div><strong>{lead.name}</strong><span>{lead.email}{lead.phone ? ` · ${lead.phone}` : ""}</span></div><time>{new Date(lead.createdAt).toLocaleString("pt-BR")}</time><p>{lead.message}</p></article>)}</div></section>
  </main>;
}
