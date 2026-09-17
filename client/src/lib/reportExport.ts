export type QuoteExportRow = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  createdAt: Date | string;
};

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
}

export function buildQuotesCsv(leads: QuoteExportRow[]) {
  const rows = [["ID", "Nome", "E-mail", "WhatsApp", "Mensagem", "Status", "Data"], ...leads.map(lead => [lead.id, lead.name, lead.email, lead.phone ?? "", lead.message, lead.status, new Date(lead.createdAt).toLocaleString("pt-BR")])];
  return "\uFEFF" + rows.map(row => row.map(csvCell).join(",")).join("\r\n");
}

export type DownloadExportRow = { projectKey: string; mediaIndex: number; downloads: number; updatedAt: Date | string };

export function buildDownloadsCsv(downloads: DownloadExportRow[]) {
  const rows = [["Projeto", "Índice da mídia", "Downloads", "Atualizado em"], ...downloads.map(item => [item.projectKey, item.mediaIndex, item.downloads, new Date(item.updatedAt).toLocaleString("pt-BR")])];
  return "\uFEFF" + rows.map(row => row.map(csvCell).join(",")).join("\r\n");
}
