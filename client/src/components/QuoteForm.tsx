import { useMemo, useState } from "react";
import { ArrowUpRight, CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { pushGtmEvent } from "@/lib/gtm";

const whatsappNumber = "5571986397739";

export default function QuoteForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", consent: false });
  const mutation = trpc.quoteRequests.create.useMutation({ onSuccess: () => { pushGtmEvent({ event: "contact_form_submit", form_name: "quote_request", lead_type: "budget_request" }); setForm({ name: "", email: "", phone: "", message: "", consent: false }); } });
  const set = (key: keyof typeof form, value: string | boolean) => setForm(current => ({ ...current, [key]: value }));
  const errors = useMemo(() => ({
    name: form.name.trim().length > 0 && form.name.trim().length < 2 ? "Informe seu nome completo." : "",
    email: form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? "Informe um e-mail válido." : "",
    message: form.message && form.message.trim().length < 10 ? "Escreva pelo menos 10 caracteres." : "",
  }), [form]);
  const hasErrors = Object.values(errors).some(Boolean);
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Olá, Deva! Gostaria de conversar sobre um projeto. Meu nome é ${form.name || ""}.`)}`;
  return <form className="quote-form" aria-busy={mutation.isPending} noValidate onSubmit={event => { event.preventDefault(); if (!form.consent || mutation.isPending || hasErrors || form.name.trim().length < 2 || !form.email || form.message.trim().length < 10) return; mutation.mutate({ ...form, name: form.name.trim(), email: form.email.trim(), message: form.message.trim(), consent: true }); }}>
    <div className="quote-form-heading"><span className="eyebrow">Novo projeto</span><h3>Conte o que você<br /><em>imagina.</em></h3></div>
    <label>Nome<input required maxLength={160} value={form.name} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "quote-name-error" : undefined} onChange={e => set("name", e.target.value)} />{errors.name && <small id="quote-name-error" className="field-error">{errors.name}</small>}</label>
    <label>E-mail<input required type="email" maxLength={320} value={form.email} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "quote-email-error" : undefined} onChange={e => set("email", e.target.value)} />{errors.email && <small id="quote-email-error" className="field-error">{errors.email}</small>}</label>
    <label>WhatsApp <span>(opcional)</span><input maxLength={40} value={form.phone} onChange={e => set("phone", e.target.value)} /></label>
    <label>Mensagem<textarea required minLength={10} maxLength={5000} rows={4} value={form.message} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "quote-message-error" : undefined} onChange={e => set("message", e.target.value)} />{errors.message && <small id="quote-message-error" className="field-error">{errors.message}</small>}</label>
    <label className="quote-consent"><input type="checkbox" checked={form.consent} onChange={e => set("consent", e.target.checked)} /> <span>Autorizo o uso destes dados exclusivamente para responder ao meu pedido de orçamento.</span></label>
    <div className="quote-actions"><button type="submit" disabled={mutation.isPending || !form.consent || hasErrors}>{mutation.isPending ? <><Loader2 className="quote-spinner" size={16} aria-hidden="true" /> Enviando pedido…</> : <>Enviar pedido <ArrowUpRight size={16} /></>}</button><a className="whatsapp-button" href={whatsappHref} target="_blank" rel="noreferrer"><MessageCircle size={16} /> Falar pelo WhatsApp</a></div>
    <p className={`quote-status ${mutation.isSuccess ? "is-success" : mutation.error ? "is-error" : ""}`} role="status" aria-live="polite">{mutation.isSuccess ? <><CheckCircle2 size={16} aria-hidden="true" /> Pedido enviado com sucesso. Responderei em breve.</> : mutation.error ? "Não foi possível enviar agora. Verifique os dados e tente novamente." : ""}</p>
  </form>;
}
