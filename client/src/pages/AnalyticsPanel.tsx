import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { buildQuotesCsv } from "@/lib/reportExport";
import { portfolioProjects } from "@/data/portfolio";

type LeadStatus = "pending" | "responded" | "completed";
type ProjectDraft = { projectKey: string; title: string; description: string; year: string; thumbnail: string; sourceUrl: string; hidden: boolean };

export default function AnalyticsPanel() {
  const { user, loading, isAuthenticated } = useAuth();
  const [days, setDays] = useState<7 | 30>(7);
  const [metric, setMetric] = useState<"views" | "clicks">("views");
  const summary = trpc.analytics.summary.useQuery({ days }, { enabled: isAuthenticated, refetchInterval: 30_000 });
  const leads = trpc.analytics.leads.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 30_000 });
  const updateLeadStatus = trpc.analytics.updateLeadStatus.useMutation({ onSuccess: () => leads.refetch() });
  const syncedProjects = trpc.behance.projects.useQuery(undefined, { enabled: isAuthenticated });
  const projectOverrides = trpc.portfolio.overrides.useQuery(undefined, { enabled: isAuthenticated });
  const [leadFilter, setLeadFilter] = useState<"all" | LeadStatus>("all");
  const [editingProject, setEditingProject] = useState<ProjectDraft | null>(null);
  const saveProject = trpc.analytics.saveProjectOverride.useMutation({ onSuccess: () => { projectOverrides.refetch(); setEditingProject(null); } });
  const deleteProject = trpc.analytics.deleteProject.useMutation({ onSuccess: () => projectOverrides.refetch() });
  const restoreProject = trpc.analytics.restoreProject.useMutation({ onSuccess: () => projectOverrides.refetch() });

  if (loading) return <main className="panel-shell"><p className="eyebrow">Carregando painel…</p></main>;
  if (!isAuthenticated) return <main className="panel-shell"><p className="eyebrow">Acesso privado</p><h1>Painel do portfólio</h1><p>Entre com a conta proprietária para ver métricas e pedidos.</p><button onClick={() => startLogin()}>Entrar</button></main>;
  if (user?.role !== "admin") return <main className="panel-shell"><p className="eyebrow">Acesso restrito</p><h1>Este painel é privado.</h1></main>;

  const data = summary.data;
  const values = data?.byDay.map(day => Number(day[metric])) ?? [];
  const maxValue = Math.max(...values, 1);
  const leadsList = leads.data ?? [];
  const filteredLeads = leadFilter === "all" ? leadsList : leadsList.filter(lead => lead.status === leadFilter);
  const leadCounts = { pending: leadsList.filter(lead => lead.status === "pending").length, responded: leadsList.filter(lead => lead.status === "responded").length, completed: leadsList.filter(lead => lead.status === "completed").length };
  const adminProjects = [...portfolioProjects, ...(syncedProjects.data ?? []).filter(remote => !portfolioProjects.some(local => local.title.trim().toLocaleLowerCase() === remote.title.trim().toLocaleLowerCase())).map(remote => ({ projectKey: `behance-${remote.projectKey}`, title: remote.title, description: remote.description ?? "Projeto publicado no Behance.", year: remote.publishedAt ? new Date(remote.publishedAt).getFullYear().toString() : "Behance", thumbnail: remote.cover ?? "", sourceUrl: remote.sourceUrl }))].map(project => {
    const projectKey = "projectKey" in project ? project.projectKey : project.slug;
    const override = projectOverrides.data?.find(item => item.projectKey === projectKey);
    return { projectKey, title: override?.title ?? project.title, description: override?.description ?? project.description, year: override?.year ?? project.year, thumbnail: override?.thumbnail ?? project.thumbnail, sourceUrl: override?.sourceUrl ?? project.sourceUrl, hidden: Boolean(override?.hidden) };
  });
  const exportLeadsCsv = () => {
    const blob = new Blob([buildQuotesCsv(leads.data ?? [])], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `pedidos-orcamento-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
  };
  return <main className="panel-shell" id="analytics-report">
    <header className="panel-header"><div><p className="eyebrow">Deva Braga / analytics</p><h1>O que está acontecendo.</h1><p className="panel-subtitle">Dados agregados, atualizados automaticamente a cada 30 segundos.</p></div><div className="panel-actions"><a href="/">Voltar ao site ↗</a><button className="print-button" onClick={() => window.print()}>Exportar relatório PDF ↓</button></div></header>
    <section className="metric-grid"><article><span>Visualizações totais</span><strong>{data?.totals.views ?? "—"}</strong></article><article><span>Visitantes únicos</span><strong>{data?.totals.visitors ?? "—"}</strong></article><article><span>Cliques em projetos</span><strong>{data?.totals.clicks ?? "—"}</strong></article></section>
    <section className="lead-summary-grid"><button className={leadFilter === "all" ? "active" : ""} onClick={() => setLeadFilter("all")}><span>Todos os pedidos</span><strong>{leadsList.length}</strong></button><button className={leadFilter === "pending" ? "active" : ""} onClick={() => setLeadFilter("pending")}><span>Pendentes</span><strong>{leadCounts.pending}</strong></button><button className={leadFilter === "responded" ? "active" : ""} onClick={() => setLeadFilter("responded")}><span>Respondidos</span><strong>{leadCounts.responded}</strong></button><button className={leadFilter === "completed" ? "active" : ""} onClick={() => setLeadFilter("completed")}><span>Concluídos</span><strong>{leadCounts.completed}</strong></button></section>
    <section className="panel-card chart-card"><div className="panel-card-heading"><div><span className="eyebrow">Desempenho diário</span><p className="chart-caption">{metric === "views" ? "Visualizações de página" : "Aberturas de projetos"}</p></div><div className="chart-controls"><div className="segmented"><button className={days === 7 ? "active" : ""} onClick={() => setDays(7)}>7 dias</button><button className={days === 30 ? "active" : ""} onClick={() => setDays(30)}>30 dias</button></div><div className="segmented"><button className={metric === "views" ? "active" : ""} onClick={() => setMetric("views")}>Visitas</button><button className={metric === "clicks" ? "active" : ""} onClick={() => setMetric("clicks")}>Cliques</button></div></div></div><div className="bar-chart interactive-chart">{(data?.byDay ?? []).map(day => <button className="bar-column" key={day.day} title={`${day.day}: ${day[metric]}`}><span className="bar-value">{day[metric]}</span><div className="bar" style={{ height: `${Math.max(6, Number(day[metric]) / maxValue * 100)}%` }} /><small>{day.day.slice(5)}</small></button>)}</div></section>
    <section className="panel-grid"><article className="panel-card"><div className="panel-card-heading"><span className="eyebrow">Projetos mais clicados</span><span>Período selecionado</span></div><ol className="rank-list">{(data?.topProjects ?? []).map(item => <li key={item.projectKey ?? "unknown"}><span>{item.projectKey ?? "Página geral"}</span><strong>{item.clicks}</strong></li>)}</ol></article><article className="panel-card privacy-card"><span className="eyebrow">Privacidade por desenho</span><p>O painel usa eventos agregados e um identificador técnico aleatório. Não registra IP, conteúdo de formulário ou dados pessoais de visitantes que recusaram cookies.</p></article></section>
    <section className="panel-card project-admin-card"><div className="panel-card-heading"><div><span className="eyebrow">Gerenciar projetos</span><span>{adminProjects.length} no catálogo</span></div><span>Editar ou ocultar</span></div><div className="project-admin-list">{adminProjects.map(project => <article key={project.projectKey} className={project.hidden ? "is-hidden" : ""}><div><strong>{project.title}</strong><span>{project.year} · {project.projectKey}</span></div><div className="project-admin-actions"><button onClick={() => setEditingProject(project)}>{project.hidden ? "Revisar" : "Editar"}</button>{project.hidden ? <button onClick={() => restoreProject.mutate({ projectKey: project.projectKey })}>Restaurar</button> : <button className="danger-button" onClick={() => { if (window.confirm(`Ocultar “${project.title}” do portfólio?`)) deleteProject.mutate({ projectKey: project.projectKey }); }}>Excluir</button>}</div></article>)}</div></section>
    <section className="panel-card leads-card"><div className="panel-card-heading"><div><span className="eyebrow">Pedidos de orçamento</span><span>{filteredLeads.length} exibidos / {leadsList.length} registrados</span></div><button className="csv-button" onClick={exportLeadsCsv} disabled={!leadsList.length}>Exportar CSV ↓</button></div><div className="leads-list">{filteredLeads.map(lead => <article key={lead.id}><div className="lead-main"><div><strong>{lead.name}</strong><span>{lead.email}{lead.phone ? ` · ${lead.phone}` : ""}</span></div><label className="lead-status">Status<select value={lead.status} disabled={updateLeadStatus.isPending} onChange={event => updateLeadStatus.mutate({ id: lead.id, status: event.target.value as LeadStatus })}><option value="pending">Pendente</option><option value="responded">Respondido</option><option value="completed">Concluído</option></select></label></div><time>{new Date(lead.createdAt).toLocaleString("pt-BR")}</time><p>{lead.message}</p></article>)}</div></section>
    {editingProject && <div className="project-editor-overlay" role="dialog" aria-modal="true" aria-label="Editar projeto"><form className="project-editor" onSubmit={event => { event.preventDefault(); saveProject.mutate(editingProject); }}><div className="panel-card-heading"><span className="eyebrow">Editar projeto</span><button type="button" className="editor-close" onClick={() => setEditingProject(null)}>Fechar ×</button></div><label>Título<input value={editingProject.title} onChange={event => setEditingProject({ ...editingProject, title: event.target.value })} required /></label><label>Ano<input value={editingProject.year} onChange={event => setEditingProject({ ...editingProject, year: event.target.value })} required /></label><label>Descrição<textarea value={editingProject.description} onChange={event => setEditingProject({ ...editingProject, description: event.target.value })} rows={5} /></label><label>Thumbnail<input type="url" value={editingProject.thumbnail} onChange={event => setEditingProject({ ...editingProject, thumbnail: event.target.value })} /></label><label>URL original<input type="url" value={editingProject.sourceUrl} onChange={event => setEditingProject({ ...editingProject, sourceUrl: event.target.value })} required /></label><button className="save-project-button" disabled={saveProject.isPending}>{saveProject.isPending ? "Salvando…" : "Salvar alterações"}</button></form></div>}
  </main>;
}
