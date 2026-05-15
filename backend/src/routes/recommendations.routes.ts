import { Signal } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/config/prisma.js";
import { asyncHandler } from "@/middleware/asyncHandler.js";
import { requireAuth } from "@/middleware/auth.js";
import { latestClose, signalFromHistory } from "@/services/marketData.service.js";
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
    include: { stock: { include: { prices: { orderBy: { date: "asc" }, take: 730 } } } },
    orderBy: [{ suitabilityScore: "desc" }, { createdAt: "desc" }],
    take: 50
  }).then((items) =>
    items.map(({ stock, ...item }) => {
      const metrics = signalFromHistory(stock.prices, "MODERATE", "MEDIUM_TERM", stock.sector);
      const { prices: _prices, ...stockData } = stock;
      return {
        ...item,
        riskLevel: metrics.riskLevel,
        volatility: metrics.volatility,
        stock: { ...stockData, currentPrice: latestClose(stock.prices) || Number(stock.currentPrice) }
      };
    })
  );

recommendationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const filters = z
      .object({
        signal: z.nativeEnum(Signal).optional(),
        sector: z.string().optional(),
        riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
        q: z.string().optional()
      })
      .parse(req.query);
    const recommendations = await listRecommendations(req.user!.id, filters);
    ok(
      res,
      filters.riskLevel ? recommendations.filter((item) => item.riskLevel === filters.riskLevel) : recommendations
    );
  })
);

recommendationsRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const profile = await prisma.profile.findUnique({ where: { userId: req.user!.id } });
    if (!profile) {
      throw new AppError("Complete your financial profile first.", 400);
    }

    const stocks = await prisma.stock.findMany({
      where: { isActive: true },
      include: { prices: { orderBy: { date: "asc" }, take: 730 } }
    });
    const generated = stocks
      .filter((stock) => stock.prices.length >= 500)
      .map((stock) => {
        const metrics = signalFromHistory(stock.prices, profile.riskAppetite, profile.investmentGoal, stock.sector);
        const allocation = metrics.signal === "BUY" ? 0.08 : metrics.signal === "HOLD" ? 0.03 : 0;
        return {
          ticker: stock.ticker,
          signal: metrics.signal,
          suitability_score: metrics.suitabilityScore,
          confidence: metrics.confidence,
          suggested_amount: Math.round(Number(profile.investableAmount) * allocation),
          explanation:
            `${stock.name} is classified as ${metrics.riskLevel.toLowerCase()} risk based on ${metrics.volatility}% annualized volatility. ` +
            `Historical indicators show ${metrics.momentum}% 45-day momentum and RSI ${metrics.rsi}, producing a ${metrics.signal} signal for your ${profile.riskAppetite.toLowerCase()} profile.`
        };
      })
      .sort((a, b) => b.suitability_score - a.suitability_score);

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
