import { Bell, Check, Settings2 } from "lucide-react";
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";

type Severity = "info" | "success" | "warning" | "urgent";

type Template = { id: number; eventKey: string; title: string; message: string; severity: Severity; enabled: number };

export default function NotificationCenter() {
  const notifications = trpc.analytics.notifications.useQuery(undefined, { refetchInterval: 15_000 });
  const templates = trpc.analytics.notificationTemplates.useQuery();
  const markRead = trpc.analytics.markNotificationRead.useMutation({ onSuccess: () => notifications.refetch() });
  const saveTemplate = trpc.analytics.saveNotificationTemplate.useMutation({ onSuccess: () => templates.refetch() });
  const [showTemplates, setShowTemplates] = useState(false);
  const unread = useMemo(() => (notifications.data ?? []).filter(item => !item.readAt).length, [notifications.data]);

  return <section className="panel-card notification-center">
    <div className="panel-card-heading"><div><span className="eyebrow notification-heading"><Bell size={13} /> Central de notificações</span><span>{unread ? `${unread} não lida${unread === 1 ? "" : "s"}` : "Tudo em dia"}</span></div><button className="notification-settings" onClick={() => setShowTemplates(value => !value)} aria-expanded={showTemplates}><Settings2 size={15} /> Modelos</button></div>
    <div className="notification-list">{(notifications.data ?? []).length === 0 ? <p className="notification-empty">Nenhuma notificação registrada ainda.</p> : (notifications.data ?? []).map(item => <article key={item.id} className={`notification-item ${item.readAt ? "is-read" : "is-unread"} severity-${item.severity}`}><div><strong>{item.title}</strong><p>{item.message}</p><time>{new Date(item.createdAt).toLocaleString("pt-BR")}</time></div>{!item.readAt && <button onClick={() => markRead.mutate({ id: item.id })} aria-label="Marcar notificação como lida" title="Marcar como lida"><Check size={15} /></button>}</article>)}</div>
    {showTemplates && <div className="notification-templates"><div className="panel-card-heading"><div><span className="eyebrow">Modelos por evento</span><span>Variáveis: {"{{name}}"}, {"{{email}}"}, {"{{message}}"}, {"{{status}}"}</span></div></div>{(templates.data as Template[] | undefined ?? []).map(template => <TemplateEditor key={template.id} template={template} onSave={input => saveTemplate.mutate(input)} saving={saveTemplate.isPending} />)}{(templates.data ?? []).length === 0 && <p className="notification-empty">Os modelos padrão serão criados no primeiro evento.</p>}</div>}
  </section>;
}

function TemplateEditor({ template, onSave, saving }: { template: Template; onSave: (input: { eventKey: string; title: string; message: string; severity: Severity; enabled: boolean }) => void; saving: boolean }) {
  const [draft, setDraft] = useState({ title: template.title, message: template.message, severity: template.severity, enabled: Boolean(template.enabled) });
  return <form className="template-editor" onSubmit={event => { event.preventDefault(); onSave({ eventKey: template.eventKey, ...draft }); }}><div><strong>{template.eventKey}</strong><label className="template-enabled"><input type="checkbox" checked={draft.enabled} onChange={event => setDraft({ ...draft, enabled: event.target.checked })} /> ativo</label></div><input aria-label={`Título do modelo ${template.eventKey}`} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} /><textarea aria-label={`Mensagem do modelo ${template.eventKey}`} rows={2} value={draft.message} onChange={event => setDraft({ ...draft, message: event.target.value })} /><div className="template-footer"><select value={draft.severity} onChange={event => setDraft({ ...draft, severity: event.target.value as Severity })}><option value="info">Informativo</option><option value="success">Sucesso</option><option value="warning">Atenção</option><option value="urgent">Urgente</option></select><button disabled={saving}>{saving ? "Salvando…" : "Salvar modelo"}</button></div></form>;
}
