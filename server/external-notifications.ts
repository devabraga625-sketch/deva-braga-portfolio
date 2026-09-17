import nodemailer from "nodemailer";
import { getNotificationProviderConfig } from "./notification-settings";

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

function smtpConfigured(config: Awaited<ReturnType<typeof getNotificationProviderConfig>>) {
  return Boolean(config.smtpHost && config.smtpPort && config.smtpUser && config.smtpPassword && config.smtpFrom && config.notificationEmail);
}

function metaConfigured(config: Awaited<ReturnType<typeof getNotificationProviderConfig>>) {
  return Boolean(config.metaWhatsAppAccessToken && config.metaWhatsAppPhoneNumberId && config.metaWhatsAppTo);
}

export async function verifySmtpConnection(): Promise<boolean> {
  const config = await getNotificationProviderConfig();
  if (!smtpConfigured(config)) return false;
  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    requireTLS: !config.smtpSecure,
    auth: { user: config.smtpUser, pass: config.smtpPassword },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.warn("[Notifications] SMTP verification failed:", error instanceof Error ? error.message : "unknown error");
    return false;
  } finally {
    transporter.close();
  }
}

async function sendGmailSmtp(input: QuoteNotification): Promise<boolean> {
  const config = await getNotificationProviderConfig();
  if (!smtpConfigured(config)) {
    console.warn("[Notifications] Gmail SMTP is not fully configured");
    return false;
  }
  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    requireTLS: !config.smtpSecure,
    auth: { user: config.smtpUser, pass: config.smtpPassword },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  const text = notificationText(input);
  const html = `<h2>Novo pedido de orçamento</h2><p><strong>Nome:</strong> ${escapeHtml(input.name)}</p><p><strong>Email:</strong> ${escapeHtml(input.email)}</p><p><strong>Telefone:</strong> ${escapeHtml(input.phone || "Não informado")}</p><p><strong>Mensagem:</strong></p><p>${escapeHtml(input.message).replace(/\n/g, "<br />")}</p>`;
  try {
    await transporter.sendMail({
      from: config.smtpFrom,
      to: config.notificationEmail,
      replyTo: input.email,
      subject: `Novo pedido de orçamento — ${input.name}`,
      text,
      html,
      headers: { "X-Portfolio-Request-ID": String(input.id ?? `${Date.now()}-${input.email}`) },
    });
    return true;
  } catch (error) {
    console.warn("[Notifications] Gmail SMTP send failed:", error instanceof Error ? error.message : "unknown error");
    return false;
  } finally {
    transporter.close();
  }
}

async function sendMetaWhatsApp(input: QuoteNotification): Promise<boolean> {
  const config = await getNotificationProviderConfig();
  if (!metaConfigured(config)) {
    console.warn("[Notifications] Meta WhatsApp is not fully configured");
    return false;
  }
  const endpoint = `https://graph.facebook.com/v23.0/${encodeURIComponent(config.metaWhatsAppPhoneNumberId)}/messages`;
  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: config.metaWhatsAppTo,
    type: "text",
    text: { preview_url: false, body: `Novo pedido de orçamento — ${input.name}\nEmail: ${input.email}\nTelefone: ${input.phone || "Não informado"}\n\n${input.message}`.slice(0, 4096) },
  };
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.metaWhatsAppAccessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      console.warn(`[Notifications] Meta WhatsApp failed (${response.status})`);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notifications] Meta WhatsApp request failed:", error instanceof Error ? error.message : "unknown error");
    return false;
  }
}

export async function sendQuoteNotifications(input: QuoteNotification) {
  const [email, whatsapp] = await Promise.all([sendGmailSmtp(input), sendMetaWhatsApp(input)]);
  return { email, whatsapp, delivered: email || whatsapp };
}
