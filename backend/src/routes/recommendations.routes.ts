import { Signal } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/config/prisma.js";
import { asyncHandler } from "@/middleware/asyncHandler.js";
import { requireAuth } from "@/middleware/auth.js";
import { requestRecommendations } from "@/services/mlClient.js";
import { ok } from "@/utils/envelope.js";
import { AppError } from "@/utils/appError.js";

export const recommendationsRouter = Router();
recommendationsRouter.use(requireAuth);

const listRecommendations = async (userId: string, filters: { signal?: Signal; sector?: string; q?: string }) =>
  prisma.recommendation.findMany({
    where: {
      userId,
      ...(filters.signal ? { signal: filters.signal } : {}),
      stock: {
        ...(filters.sector ? { sector: filters.sector } : {}),
        ...(filters.q
          ? {
              OR: [
                { ticker: { contains: filters.q, mode: "insensitive" } },
                { name: { contains: filters.q, mode: "insensitive" } }
              ]
            }
          : {})
      }
    },
    include: { stock: true },
    orderBy: [{ suitabilityScore: "desc" }, { createdAt: "desc" }],
    take: 50
  });

recommendationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const filters = z
      .object({
        signal: z.nativeEnum(Signal).optional(),
        sector: z.string().optional(),
        q: z.string().optional()
      })
      .parse(req.query);
    ok(res, await listRecommendations(req.user!.id, filters));
  })
);

recommendationsRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const profile = await prisma.profile.findUnique({ where: { userId: req.user!.id } });
    if (!profile) {
      throw new AppError("Complete your financial profile first.", 400);
    }

    const stocks = await prisma.stock.findMany({ where: { isActive: true } });
    const generated = await requestRecommendations({
      risk_appetite: profile.riskAppetite,
      investment_goal: profile.investmentGoal,
      investable_amount: Number(profile.investableAmount),
      stocks: stocks.map((stock) => ({
        ticker: stock.ticker,
        name: stock.name,
        sector: stock.sector,
        current_price: Number(stock.currentPrice),
        change_pct: Number(stock.changePct)
      }))
    });

    await prisma.recommendation.deleteMany({ where: { userId: req.user!.id } });
    for (const item of generated) {
      const stock = stocks.find((candidate) => candidate.ticker === item.ticker);
      if (stock) {
        await prisma.recommendation.create({
          data: {
            userId: req.user!.id,
            stockId: stock.id,
            signal: item.signal,
            suitabilityScore: item.suitability_score,
            confidence: item.confidence,
            suggestedAmount: item.suggested_amount,
            explanation: item.explanation
          }
        });
      }
    }

    ok(res, await listRecommendations(req.user!.id, {}), 201);
  })
);
