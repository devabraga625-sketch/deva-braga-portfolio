import { z } from "zod";
import { COOKIE_NAME, TWO_FACTOR_PENDING_COOKIE } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import { getSessionCookieOptions } from "./_core/cookies";
import { notifyOwner } from "./_core/notification";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { createQuoteRequest, createTemplatedNotification, deletePortfolioProjectOverride, getProjectAccessCounts, getTrafficSummary, getUserByOpenId, listAuditLogs, listBehanceProjects, listBrokenAssetEvents, listNotificationTemplates, listNotifications, listPortfolioProjectOverrides, listQuoteRequests, markNotificationRead, recordAuditLog, recordTrafficEvent, setPortfolioProjectAsset, updateQuoteRequestStatus, updateUserTwoFactor, upsertNotificationTemplate, upsertPortfolioProjectOverride } from "./db";
import { storagePut } from "./storage";
import { sendQuoteNotifications } from "./external-notifications";
import { createEncryptedBackup } from "./backup";
import { createTwoFactorEnrollment, decryptTwoFactorSecret, encryptTwoFactorSecret, verifyTwoFactorCode } from "./two-factor";
import { sdk } from "./_core/sdk";

async function getPendingTwoFactorUser(req: { headers: { cookie?: string } }) {
  const token = parseCookieHeader(req.headers.cookie ?? "")[TWO_FACTOR_PENDING_COOKIE];
  const pending = await sdk.verifyTwoFactorPendingToken(token);
  if (!pending) return null;
  return getUserByOpenId(pending.openId);
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie(TWO_FACTOR_PENDING_COOKIE, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  twoFactor: router({
    status: publicProcedure.query(async ({ ctx }) => {
      const user = await getPendingTwoFactorUser(ctx.req);
      if (!user) return null;
      return { state: user.twoFactorEnabled ? "verify" as const : "setup" as const, label: user.email ?? user.name ?? user.openId, role: user.role };
    }),
    begin: publicProcedure.mutation(async ({ ctx }) => {
      const user = await getPendingTwoFactorUser(ctx.req);
      if (!user) throw new Error("Sessão temporária de autenticação ausente ou expirada.");
      if (user.twoFactorEnabled) throw new Error("O 2FA já está configurado para esta conta.");
      const enrollment = await createTwoFactorEnrollment(user.email ?? user.name ?? user.openId);
      await updateUserTwoFactor(user.openId, { twoFactorSecret: encryptTwoFactorSecret(enrollment.secret), twoFactorEnabled: 0, twoFactorRequired: 1 });
      return { qrCode: enrollment.qrCode, secret: enrollment.secret, label: user.email ?? user.name ?? user.openId };
    }),
    confirmSetup: publicProcedure.input(z.object({ code: z.string().regex(/^\d{6}$/) })).mutation(async ({ ctx, input }) => {
      const token = parseCookieHeader(ctx.req.headers.cookie ?? "")[TWO_FACTOR_PENDING_COOKIE];
      const pending = await sdk.verifyTwoFactorPendingToken(token);
      const user = pending ? await getUserByOpenId(pending.openId) : null;
      if (!user || !user.twoFactorSecret) throw new Error("Inicie a configuração do 2FA novamente.");
      const result = await verifyTwoFactorCode(user.openId, decryptTwoFactorSecret(user.twoFactorSecret), input.code);
      if (result.rateLimited) throw new Error("Muitas tentativas. Aguarde alguns minutos.");
      if (!result.valid) throw new Error("Código inválido. Confira o aplicativo autenticador e tente novamente.");
      await updateUserTwoFactor(user.openId, { twoFactorEnabled: 1, twoFactorRequired: 1 });
      const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name ?? "", twoFactorVerified: true });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: 1000 * 60 * 60 * 24 * 365 });
      ctx.res.clearCookie(TWO_FACTOR_PENDING_COOKIE, { ...cookieOptions, maxAge: -1 });
      await recordAuditLog({ actor: user.email ?? user.name ?? user.openId, entityType: "user", entityKey: user.openId, action: "two_factor_enabled", details: "TOTP configurado com QR Code" });
      return { ok: true as const, role: user.role };
    }),
    verify: publicProcedure.input(z.object({ code: z.string().regex(/^\d{6}$/) })).mutation(async ({ ctx, input }) => {
      const token = parseCookieHeader(ctx.req.headers.cookie ?? "")[TWO_FACTOR_PENDING_COOKIE];
      const pending = await sdk.verifyTwoFactorPendingToken(token);
      const user = pending ? await getUserByOpenId(pending.openId) : null;
      if (!user?.twoFactorSecret || !user.twoFactorEnabled) throw new Error("Sessão de 2FA ausente ou expirada.");
      const result = await verifyTwoFactorCode(user.openId, decryptTwoFactorSecret(user.twoFactorSecret), input.code);
      if (result.rateLimited) throw new Error("Muitas tentativas. Aguarde alguns minutos.");
      if (!result.valid) throw new Error("Código inválido. Confira o aplicativo autenticador e tente novamente.");
      const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name ?? "", twoFactorVerified: true });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: 1000 * 60 * 60 * 24 * 365 });
      ctx.res.clearCookie(TWO_FACTOR_PENDING_COOKIE, { ...cookieOptions, maxAge: -1 });
      return { ok: true as const, role: user.role };
    }),
  }),
  behance: router({
    projects: publicProcedure.query(async () => listBehanceProjects()),
  }),
  portfolio: router({
    overrides: publicProcedure.query(() => listPortfolioProjectOverrides()),
  }),
  analytics: router({
    track: publicProcedure.input(z.object({ eventType: z.enum(["page_view", "project_click", "external_click", "asset_error"]), path: z.string().max(255), projectKey: z.string().max(191).optional(), visitorId: z.string().regex(/^[a-zA-Z0-9_-]{8,64}$/) })).mutation(async ({ input }) => {
      await recordTrafficEvent(input);
      return { ok: true } as const;
    }),
    summary: adminProcedure.input(z.object({ days: z.union([z.literal(7), z.literal(30)]).default(7) })).query(({ input }) => getTrafficSummary(input.days)),
    leads: adminProcedure.query(() => listQuoteRequests()),
    updateLeadStatus: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["pending", "responded", "completed"]) })).mutation(async ({ input, ctx }) => { await updateQuoteRequestStatus(input.id, input.status); await createTemplatedNotification({ eventKey: "lead_status_changed", variables: { id: String(input.id), status: input.status }, fallback: { title: "Pedido atualizado", message: `O pedido #${input.id} mudou para ${input.status}.`, severity: "info" } }); await recordAuditLog({ actor: ctx.user.email ?? ctx.user.name ?? ctx.user.openId, entityType: "quote", entityKey: String(input.id), action: "status_changed", details: JSON.stringify({ status: input.status }) }); return { ok: true as const }; }),
    projectAccess: publicProcedure.query(() => getProjectAccessCounts()),
    saveProjectOverride: adminProcedure.input(z.object({ projectKey: z.string().min(1).max(191), title: z.string().trim().min(1).max(500), description: z.string().max(10000), year: z.string().regex(/^\d{4}$/), thumbnail: z.union([z.string().url().max(2000), z.literal("")]), sourceUrl: z.string().url().max(2000), hidden: z.boolean().default(false), allowDownloads: z.boolean().default(false), mediaMetadata: z.record(z.string(), z.object({ caption: z.string().max(500).optional(), alt: z.string().max(500).optional(), credit: z.string().max(300).optional() })).optional() })).mutation(async ({ input, ctx }) => { await upsertPortfolioProjectOverride(input); await createTemplatedNotification({ eventKey: "project_updated", variables: { projectKey: input.projectKey, title: input.title }, fallback: { title: "Projeto atualizado", message: `O projeto “${input.title}” foi atualizado no painel.`, severity: "success" } }); await recordAuditLog({ actor: ctx.user.email ?? ctx.user.name ?? ctx.user.openId, entityType: "project", entityKey: input.projectKey, action: "updated", details: JSON.stringify({ title: input.title, year: input.year, allowDownloads: input.allowDownloads }) }); return { ok: true as const }; }),
    deleteProject: adminProcedure.input(z.object({ projectKey: z.string().min(1).max(191) })).mutation(async ({ input, ctx }) => { await upsertPortfolioProjectOverride({ projectKey: input.projectKey, hidden: true }); await recordAuditLog({ actor: ctx.user.email ?? ctx.user.name ?? ctx.user.openId, entityType: "project", entityKey: input.projectKey, action: "hidden", details: "Projeto ocultado do catálogo" }); return { ok: true as const }; }),
    restoreProject: adminProcedure.input(z.object({ projectKey: z.string().min(1).max(191) })).mutation(async ({ input, ctx }) => { await deletePortfolioProjectOverride(input.projectKey); await recordAuditLog({ actor: ctx.user.email ?? ctx.user.name ?? ctx.user.openId, entityType: "project", entityKey: input.projectKey, action: "restored", details: "Override removido e projeto restaurado" }); return { ok: true as const }; }),
    uploadProjectAsset: adminProcedure.input(z.object({ projectKey: z.string().min(1).max(191), kind: z.enum(["thumbnail", "media"]), fileName: z.string().min(1).max(180), contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]), dataBase64: z.string().min(1).max(20_000_000) })).mutation(async ({ input, ctx }) => { const data = Buffer.from(input.dataBase64, "base64"); if (data.byteLength > 12 * 1024 * 1024) throw new Error("Imagem muito grande. Limite de 12 MB."); const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-"); const uploaded = await storagePut(`portfolio/${input.projectKey}/${input.kind}/${safeName}`, data, input.contentType); await setPortfolioProjectAsset(input.projectKey, input.kind, uploaded.url); await recordAuditLog({ actor: ctx.user.email ?? ctx.user.name ?? ctx.user.openId, entityType: "project", entityKey: input.projectKey, action: input.kind === "thumbnail" ? "thumbnail_uploaded" : "media_uploaded", details: JSON.stringify({ fileName: input.fileName, url: uploaded.url }) }); return { url: uploaded.url } as const; }),
    audit: adminProcedure.query(() => listAuditLogs()),
    brokenAssets: adminProcedure.query(() => listBrokenAssetEvents()),
    notifications: adminProcedure.query(() => listNotifications()),
    markNotificationRead: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => markNotificationRead(input.id)),
    notificationTemplates: adminProcedure.query(() => listNotificationTemplates()),
    saveNotificationTemplate: adminProcedure.input(z.object({ eventKey: z.string().min(1).max(64), title: z.string().min(1).max(160), message: z.string().min(1).max(5000), severity: z.enum(["info", "success", "warning", "urgent"]), enabled: z.boolean() })).mutation(({ input }) => upsertNotificationTemplate(input)),
    createEncryptedBackup: adminProcedure.mutation(async ({ ctx }) => { const backup = await createEncryptedBackup(); await recordAuditLog({ actor: ctx.user.email ?? ctx.user.name ?? ctx.user.openId, entityType: "security", entityKey: "database", action: "encrypted_backup_created", details: JSON.stringify({ algorithm: backup.algorithm, version: backup.version }) }); return { fileName: `deva-backup-${new Date().toISOString().slice(0, 10)}.json.enc`, backup }; }),
  }),
  quoteRequests: router({
    create: publicProcedure.input(z.object({ name: z.string().trim().min(2).max(160), email: z.string().email().max(320), phone: z.string().trim().max(40).optional(), message: z.string().trim().min(10).max(5000), consent: z.literal(true) })).mutation(async ({ input }) => {
      await createQuoteRequest(input);
      const content = `${input.name} (${input.email}) enviou um pedido de orçamento pelo portfólio.\n\n${input.message}`;
      await createTemplatedNotification({ eventKey: "quote_received", variables: { name: input.name, email: input.email, phone: input.phone ?? "Não informado", message: input.message }, fallback: { title: "Novo pedido de orçamento", message: content, severity: "urgent" } });
      const [internal, external] = await Promise.all([
        notifyOwner({ title: "Novo pedido de orçamento", content }).catch(() => false),
        sendQuoteNotifications(input).catch(() => ({ email: false, whatsapp: false, delivered: false })),
      ]);
      return { ok: true as const, notified: internal || external.delivered, channels: { internal, email: external.email, whatsapp: external.whatsapp } };
    }),
  }),
});

export type AppRouter = typeof appRouter;
