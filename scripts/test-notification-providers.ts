import { notifyOwner } from "../server/_core/notification";
import { sendQuoteNotifications } from "../server/external-notifications";

const input = {
  id: 0,
  name: "TESTE DE NOTIFICAÇÃO",
  email: "deva.jpeg@gmail.com",
  phone: "+55 71 98639-7739",
  message: "Teste controlado dos canais Gmail SMTP, Meta WhatsApp e fallback interno. Não é um pedido real.",
};

const [internal, external] = await Promise.all([
  notifyOwner({ title: "TESTE DE NOTIFICAÇÃO", content: "Teste controlado do portfólio: Gmail SMTP + Meta WhatsApp + fallback interno." }).catch(() => false),
  sendQuoteNotifications(input).catch(() => ({ email: false, whatsapp: false, delivered: false })),
]);
console.log(JSON.stringify({ internal, email: external.email, whatsapp: external.whatsapp, delivered: internal || external.delivered }));
