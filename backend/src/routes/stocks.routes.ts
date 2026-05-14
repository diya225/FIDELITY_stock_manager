import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/config/prisma.js";
import { asyncHandler } from "@/middleware/asyncHandler.js";
import { requireAuth } from "@/middleware/auth.js";
import { ok } from "@/utils/envelope.js";

export const stocksRouter = Router();
stocksRouter.use(requireAuth);

stocksRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = z
      .object({
        q: z.string().optional(),
        sector: z.string().optional()
      })
      .parse(req.query);

    const stocks = await prisma.stock.findMany({
      where: {
        isActive: true,
        ...(query.sector ? { sector: query.sector } : {}),
        ...(query.q
          ? {
              OR: [
                { ticker: { contains: query.q, mode: "insensitive" } },
                { name: { contains: query.q, mode: "insensitive" } }
              ]
            }
          : {})
      },
      orderBy: { ticker: "asc" }
    });

    ok(res, stocks);
  })
);

stocksRouter.get(
  "/:ticker/prices",
  asyncHandler(async (req, res) => {
    const stock = await prisma.stock.findUnique({
      where: { ticker: req.params.ticker },
      include: { prices: { orderBy: { date: "asc" }, take: 365 } }
    });
    ok(res, stock?.prices ?? []);
  })
);
