import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { notifyOwner } from "./_core/notification";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { createQuoteRequest, getTrafficSummary, listBehanceProjects, listQuoteRequests, recordTrafficEvent } from "./db";

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
  analytics: router({
    track: publicProcedure.input(z.object({ eventType: z.enum(["page_view", "project_click", "external_click"]), path: z.string().max(255), projectKey: z.string().max(191).optional(), visitorId: z.string().regex(/^[a-zA-Z0-9_-]{8,64}$/) })).mutation(async ({ input }) => {
      await recordTrafficEvent(input);
      return { ok: true } as const;
    }),
    summary: adminProcedure.input(z.object({ days: z.union([z.literal(7), z.literal(30)]).default(7) })).query(({ input }) => getTrafficSummary(input.days)),
    leads: adminProcedure.query(() => listQuoteRequests()),
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
