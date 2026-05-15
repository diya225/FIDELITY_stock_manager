import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/config/prisma.js";
import { asyncHandler } from "@/middleware/asyncHandler.js";
import { requireAdmin, requireAuth } from "@/middleware/auth.js";
import { ok } from "@/utils/envelope.js";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

adminRouter.get(
  "/users",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true }
    });
    ok(res, users);
  })
);

adminRouter.put(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const body = z.object({ isActive: z.boolean() }).parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: body,
      select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true }
    });
    ok(res, user);
  })
);

adminRouter.get(
  "/stocks",
  asyncHandler(async (_req, res) => {
    const stocks = await prisma.stock.findMany({
      orderBy: [{ isActive: "desc" }, { ticker: "asc" }]
    });
    ok(res, stocks);
  })
);

adminRouter.put(
  "/stocks/:ticker",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        currentPrice: z.number().positive().optional(),
        changePct: z.number().optional(),
        isActive: z.boolean().optional()
      })
      .parse(req.body);
    const stock = await prisma.stock.update({
      where: { ticker: req.params.ticker },
      data: body
    });
    ok(res, stock);
  })
);
