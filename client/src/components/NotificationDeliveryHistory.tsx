import { AlertTriangle, CheckCheck, CheckCircle2, Clock3, RotateCw, Send } from "lucide-react";
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";

type Quote = { id: number; name: string; email: string };

type DeliveryItem = {
  id: number;
  quoteRequestId: number | null;
  channel: string;
  attemptType: string;
  status: string;
  providerStatus: string | null;
  errorCode: string | null;
  providerMessageId: string | null;
  createdAt: Date | string;
};

function statusMeta(item: DeliveryItem) {
  if (item.status === "failed") {
    return { label: "Falhou", detail: item.errorCode ? ` · ${item.errorCode}` : "", className: "delivery-status-pill status-failed", icon: <AlertTriangle size={13} /> };
  }
  if (item.status === "pending") {
    return { label: "Pendente", detail: " · aguardando confirmação", className: "delivery-status-pill status-pending", icon: <Clock3 size={13} /> };
  }
  if (item.channel === "whatsapp" && item.providerStatus === "read") {
    return { label: "Lido", detail: item.providerMessageId ? ` · ID ${item.providerMessageId.slice(0, 12)}` : "", className: "delivery-status-pill status-read", icon: <CheckCheck size={13} /> };
  }
  if (item.channel === "whatsapp" && item.providerStatus === "delivered") {
    return { label: "Entregue", detail: item.providerMessageId ? ` · ID ${item.providerMessageId.slice(0, 12)}` : "", className: "delivery-status-pill status-delivered", icon: <CheckCheck size={13} /> };
  }
  return {
    label: item.channel === "whatsapp" ? "Enviado à Meta" : "Enviado",
    detail: item.providerMessageId ? ` · ID ${item.providerMessageId.slice(0, 12)}` : "",
    className: "delivery-status-pill status-sent",
    icon: item.channel === "whatsapp" ? <Send size={13} /> : <CheckCircle2 size={13} />,
  };
}

export default function NotificationDeliveryHistory({ quotes }: { quotes: Quote[] }) {
  const attempts = trpc.analytics.notificationAttempts.useQuery(undefined, { refetchInterval: 15_000 });
  const retry = trpc.analytics.retryQuoteNotifications.useMutation({ onSuccess: () => attempts.refetch() });
  const quoteNames = useMemo(() => new Map(quotes.map(quote => [quote.id, quote])), [quotes]);
  const rows = attempts.data ?? [];
  const recentFailures = rows.filter(item => item.status === "failed" && Date.now() - new Date(item.createdAt).getTime() < 24 * 60 * 60 * 1000);
  const retryableQuoteIds = useMemo(() => Array.from(new Set(recentFailures.map(item => item.quoteRequestId).filter((id): id is number => Boolean(id)))), [recentFailures]);

  return <>
    {recentFailures.length > 0 && <div className="provider-alert-banner" role="alert"><AlertTriangle size={17} /><div><strong>Falha de entrega detectada</strong><span>{recentFailures.length} tentativa{recentFailures.length === 1 ? "" : "s"} falhou{recentFailures.length === 1 ? "" : "ram"} nas últimas 24 horas. Os pedidos continuam salvos no painel.</span></div><a href="#notification-delivery-history">Revisar agora ↓</a></div>}
    <section className="panel-card notification-delivery-card" id="notification-delivery-history">
      <div className="panel-card-heading"><div><span className="eyebrow">Entrega de mensagens</span><span>Histórico por canal e reenvio manual</span></div><span>{rows.length} registros</span></div>
      <div className="delivery-status-legend" aria-label="Legenda dos estados"><span><i className="status-dot dot-sent" /> Enviado</span><span><i className="status-dot dot-delivered" /> Entregue</span><span><i className="status-dot dot-read" /> Lido</span><span><i className="status-dot dot-pending" /> Pendente</span><span><i className="status-dot dot-failed" /> Falhou</span></div>
      {retryableQuoteIds.length > 0 && <div className="retry-summary"><span><AlertTriangle size={14} /> {retryableQuoteIds.length} pedido{retryableQuoteIds.length === 1 ? "" : "s"} com falha pode{retryableQuoteIds.length === 1 ? "" : "m"} ser reenviado.</span><span>O reenvio tenta somente os canais que falharam.</span></div>}
      {rows.length === 0 ? <p className="empty-panel-state">Nenhuma tentativa registrada ainda.</p> : <div className="delivery-history-list">{rows.slice(0, 80).map(item => {
        const quote = item.quoteRequestId ? quoteNames.get(item.quoteRequestId) : undefined;
        const failed = item.status === "failed";
        const meta = statusMeta(item);
        return <article key={item.id} className={failed ? "delivery-failed" : item.status === "pending" ? "delivery-pending" : "delivery-sent"}>
          <div className="delivery-history-main"><span className="delivery-status-icon" title={meta.label}>{meta.icon}</span><div><strong>{item.channel === "email" ? "Gmail SMTP" : item.channel === "whatsapp" ? "Meta WhatsApp" : "Fallback interno"}</strong><span>{quote ? `Pedido #${quote.id} · ${quote.name}` : "Teste de provedor"} · {item.attemptType === "manual_retry" ? "reenvio manual" : item.attemptType === "test" ? "teste controlado" : "envio automático"}</span></div></div>
          <div className="delivery-history-meta"><span className={meta.className}>{meta.icon}{meta.label}{meta.detail}</span><time>{new Date(item.createdAt).toLocaleString("pt-BR")}</time>{failed && item.quoteRequestId && <button className="retry-button" onClick={() => retry.mutate({ quoteRequestId: item.quoteRequestId as number })} disabled={retry.isPending}><RotateCw size={13} /> Reenviar falhas</button>}</div>
        </article>;
      })}</div>}
    </section>
  </>;
}

export type { DeliveryItem };
