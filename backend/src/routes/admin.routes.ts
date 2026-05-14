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
