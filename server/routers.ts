import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { notifyOwner } from "./_core/notification";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { createQuoteRequest, deletePortfolioProjectOverride, getProjectAccessCounts, getTrafficSummary, listAuditLogs, listBehanceProjects, listPortfolioProjectOverrides, listQuoteRequests, recordAuditLog, recordTrafficEvent, setPortfolioProjectAsset, updateQuoteRequestStatus, upsertPortfolioProjectOverride } from "./db";
import { storagePut } from "./storage";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  behance: router({
    projects: publicProcedure.query(async () => listBehanceProjects()),
  }),
  portfolio: router({
    overrides: publicProcedure.query(() => listPortfolioProjectOverrides()),
  }),
  analytics: router({
    track: publicProcedure.input(z.object({ eventType: z.enum(["page_view", "project_click", "external_click"]), path: z.string().max(255), projectKey: z.string().max(191).optional(), visitorId: z.string().regex(/^[a-zA-Z0-9_-]{8,64}$/) })).mutation(async ({ input }) => {
      await recordTrafficEvent(input);
      return { ok: true } as const;
    }),
    summary: adminProcedure.input(z.object({ days: z.union([z.literal(7), z.literal(30)]).default(7) })).query(({ input }) => getTrafficSummary(input.days)),
    leads: adminProcedure.query(() => listQuoteRequests()),
    updateLeadStatus: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["pending", "responded", "completed"]) })).mutation(async ({ input, ctx }) => { await updateQuoteRequestStatus(input.id, input.status); await recordAuditLog({ actor: ctx.user.email ?? ctx.user.name ?? ctx.user.openId, entityType: "quote", entityKey: String(input.id), action: "status_changed", details: JSON.stringify({ status: input.status }) }); return { ok: true as const }; }),
    projectAccess: publicProcedure.query(() => getProjectAccessCounts()),
    saveProjectOverride: adminProcedure.input(z.object({ projectKey: z.string().min(1).max(191), title: z.string().trim().min(1).max(500), description: z.string().max(10000), year: z.string().max(32), thumbnail: z.union([z.string().url().max(2000), z.literal("")]), sourceUrl: z.string().url().max(2000), hidden: z.boolean().default(false) })).mutation(async ({ input, ctx }) => { await upsertPortfolioProjectOverride(input); await recordAuditLog({ actor: ctx.user.email ?? ctx.user.name ?? ctx.user.openId, entityType: "project", entityKey: input.projectKey, action: "updated", details: JSON.stringify({ title: input.title, year: input.year }) }); return { ok: true as const }; }),
    deleteProject: adminProcedure.input(z.object({ projectKey: z.string().min(1).max(191) })).mutation(async ({ input, ctx }) => { await upsertPortfolioProjectOverride({ projectKey: input.projectKey, hidden: true }); await recordAuditLog({ actor: ctx.user.email ?? ctx.user.name ?? ctx.user.openId, entityType: "project", entityKey: input.projectKey, action: "hidden", details: "Projeto ocultado do catálogo" }); return { ok: true as const }; }),
    restoreProject: adminProcedure.input(z.object({ projectKey: z.string().min(1).max(191) })).mutation(async ({ input, ctx }) => { await deletePortfolioProjectOverride(input.projectKey); await recordAuditLog({ actor: ctx.user.email ?? ctx.user.name ?? ctx.user.openId, entityType: "project", entityKey: input.projectKey, action: "restored", details: "Override removido e projeto restaurado" }); return { ok: true as const }; }),
    uploadProjectAsset: adminProcedure.input(z.object({ projectKey: z.string().min(1).max(191), kind: z.enum(["thumbnail", "media"]), fileName: z.string().min(1).max(180), contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]), dataBase64: z.string().min(1).max(20_000_000) })).mutation(async ({ input, ctx }) => { const data = Buffer.from(input.dataBase64, "base64"); if (data.byteLength > 12 * 1024 * 1024) throw new Error("Imagem muito grande. Limite de 12 MB."); const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-"); const uploaded = await storagePut(`portfolio/${input.projectKey}/${input.kind}/${safeName}`, data, input.contentType); await setPortfolioProjectAsset(input.projectKey, input.kind, uploaded.url); await recordAuditLog({ actor: ctx.user.email ?? ctx.user.name ?? ctx.user.openId, entityType: "project", entityKey: input.projectKey, action: input.kind === "thumbnail" ? "thumbnail_uploaded" : "media_uploaded", details: JSON.stringify({ fileName: input.fileName, url: uploaded.url }) }); return { url: uploaded.url } as const; }),
    audit: adminProcedure.query(() => listAuditLogs()),
  }),
  quoteRequests: router({
    create: publicProcedure.input(z.object({ name: z.string().trim().min(2).max(160), email: z.string().email().max(320), phone: z.string().trim().max(40).optional(), message: z.string().trim().min(10).max(5000), consent: z.literal(true) })).mutation(async ({ input }) => {
      await createQuoteRequest(input);
      const notified = await notifyOwner({ title: "Novo pedido de orçamento", content: `${input.name} (${input.email}) enviou um pedido de orçamento pelo portfólio.\n\n${input.message}` });
      return { ok: true as const, notified };
    }),
  }),
});

export type AppRouter = typeof appRouter;
