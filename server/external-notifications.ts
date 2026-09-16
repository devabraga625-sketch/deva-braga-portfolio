import { ENV } from "./_core/env";

export type QuoteNotification = {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  message: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

function notificationText(input: QuoteNotification) {
  return [
    "Novo pedido de orçamento — Deva Braga",
    "",
    `Nome: ${input.name}`,
    `Email: ${input.email}`,
    `Telefone: ${input.phone || "Não informado"}`,
    "",
    "Mensagem:",
    input.message,
  ].join("\n");
}

async function sendResendEmail(input: QuoteNotification): Promise<boolean> {
  if (!ENV.resendApiKey || !ENV.resendFrom || !ENV.notificationEmail) {
    console.warn("[Notifications] Resend is not fully configured");
    return false;
  }
  const text = notificationText(input);
  const html = `<h2>Novo pedido de orçamento</h2><p><strong>Nome:</strong> ${escapeHtml(input.name)}</p><p><strong>Email:</strong> ${escapeHtml(input.email)}</p><p><strong>Telefone:</strong> ${escapeHtml(input.phone || "Não informado")}</p><p><strong>Mensagem:</strong></p><p>${escapeHtml(input.message).replace(/\n/g, "<br />")}</p>`;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `quote-request-${input.id ?? `${Date.now()}-${input.email}`}`.slice(0, 256),
      },
      body: JSON.stringify({ from: ENV.resendFrom, to: [ENV.notificationEmail], subject: `Novo pedido de orçamento — ${input.name}`, text, html, reply_to: input.email }),
    });
    if (!response.ok) {
      console.warn(`[Notifications] Resend failed (${response.status}): ${await response.text().catch(() => "")}`);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notifications] Resend request failed:", error);
    return false;
  }
}

async function sendTwilioWhatsApp(input: QuoteNotification): Promise<boolean> {
  if (!ENV.twilioAccountSid || !ENV.twilioAuthToken || !ENV.twilioWhatsAppFrom || !ENV.twilioWhatsAppTo) {
    console.warn("[Notifications] Twilio WhatsApp is not fully configured");
    return false;
  }
  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(ENV.twilioAccountSid)}/Messages.json`;
  const body = new URLSearchParams();
  body.set("From", ENV.twilioWhatsAppFrom);
  body.set("To", ENV.twilioWhatsAppTo);
  if (ENV.twilioContentSid) {
    body.set("ContentSid", ENV.twilioContentSid);
    body.set("ContentVariables", JSON.stringify({ "1": input.name, "2": input.email, "3": input.phone || "Não informado", "4": input.message }));
  } else {
    body.set("Body", `Novo pedido de orçamento — ${input.name}\nEmail: ${input.email}\nTelefone: ${input.phone || "Não informado"}\n\n${input.message}`);
  }
  try {
    const credentials = Buffer.from(`${ENV.twilioAccountSid}:${ENV.twilioAuthToken}`).toString("base64");
    const response = await fetch(endpoint, { method: "POST", headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" }, body });
    if (!response.ok) {
      console.warn(`[Notifications] Twilio failed (${response.status}): ${await response.text().catch(() => "")}`);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notifications] Twilio request failed:", error);
    return false;
  }
}

export async function sendQuoteNotifications(input: QuoteNotification) {
  const [email, whatsapp] = await Promise.all([sendResendEmail(input), sendTwilioWhatsApp(input)]);
  return { email, whatsapp, delivered: email || whatsapp };
}
