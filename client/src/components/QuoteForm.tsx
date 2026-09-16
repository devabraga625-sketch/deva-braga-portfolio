import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function QuoteForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", consent: false });
  const mutation = trpc.quoteRequests.create.useMutation({ onSuccess: () => setForm({ name: "", email: "", phone: "", message: "", consent: false }) });
  const set = (key: keyof typeof form, value: string | boolean) => setForm(current => ({ ...current, [key]: value }));
  return <form className="quote-form" onSubmit={event => { event.preventDefault(); if (!form.consent) return; mutation.mutate({ ...form, consent: true }); }}>
    <div className="quote-form-heading"><span className="eyebrow">Novo projeto</span><h3>Conte o que você<br /><em>imagina.</em></h3></div>
    <label>Nome<input required maxLength={160} value={form.name} onChange={e => set("name", e.target.value)} /></label>
    <label>E-mail<input required type="email" maxLength={320} value={form.email} onChange={e => set("email", e.target.value)} /></label>
    <label>WhatsApp <span>(opcional)</span><input maxLength={40} value={form.phone} onChange={e => set("phone", e.target.value)} /></label>
    <label>Mensagem<textarea required minLength={10} maxLength={5000} rows={4} value={form.message} onChange={e => set("message", e.target.value)} /></label>
    <label className="quote-consent"><input type="checkbox" checked={form.consent} onChange={e => set("consent", e.target.checked)} /> <span>Autorizo o uso destes dados exclusivamente para responder ao meu pedido de orçamento.</span></label>
    <button type="submit" disabled={mutation.isPending || !form.consent}>Enviar pedido <ArrowUpRight size={16} /></button>
    <p className="quote-status" aria-live="polite">{mutation.isSuccess ? "Pedido enviado. Obrigado pelo contato." : mutation.error ? "Não foi possível enviar agora. Tente novamente." : ""}</p>
  </form>;
}
