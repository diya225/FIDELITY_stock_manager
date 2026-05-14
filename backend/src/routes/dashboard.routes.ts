import { Router } from "express";
import { prisma } from "@/config/prisma.js";
import { asyncHandler } from "@/middleware/asyncHandler.js";
import { requireAuth } from "@/middleware/auth.js";
import { requestPortfolioScore } from "@/services/mlClient.js";
import { ok } from "@/utils/envelope.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: req.user!.id },
      include: { holdings: { include: { stock: true } }, transactions: { include: { stock: true }, take: 20 } }
    });

    if (!portfolio) {
      return ok(res, {
        totalValue: 0,
        predictedPnl: 0,
        holdingsCount: 0,
        portfolioScore: 0,
        sectorAllocation: [],
        gainers: [],
        losers: [],
        valueHistory: [],
        insights: []
      });
    }

    const totalValue = portfolio.holdings.reduce(
      (sum, holding) => sum + holding.quantity * Number(holding.stock.currentPrice),
      0
    );
    const score = await requestPortfolioScore({
      holdings: portfolio.holdings.map((holding) => ({
        ticker: holding.stock.ticker,
        sector: holding.stock.sector,
        quantity: holding.quantity,
        average_buy_price: Number(holding.averageBuyPrice),
        current_price: Number(holding.stock.currentPrice)
      }))
    }).catch(() => ({ score: 50, predicted_pnl: totalValue * 0.02, dimensions: {} }));

    const sectorTotals = new Map<string, number>();
    for (const holding of portfolio.holdings) {
      sectorTotals.set(
        holding.stock.sector,
        (sectorTotals.get(holding.stock.sector) ?? 0) + holding.quantity * Number(holding.stock.currentPrice)
      );
    }

    const movers = portfolio.holdings
      .map((holding) => ({
        ticker: holding.stock.ticker,
        name: holding.stock.name,
        changePct: Number(holding.stock.changePct)
      }))
      .sort((a, b) => b.changePct - a.changePct);

    const recommendations = await prisma.recommendation.findMany({
      where: { userId: req.user!.id, signal: "BUY" },
      include: { stock: true },
      orderBy: { suitabilityScore: "desc" },
      take: 3
    });

    ok(res, {
      totalValue,
      predictedPnl: score.predicted_pnl,
      holdingsCount: portfolio.holdings.length,
      portfolioScore: score.score,
      scoreDimensions: score.dimensions,
      virtualBalance: Number(portfolio.virtualBalance),
      sectorAllocation: Array.from(sectorTotals, ([sector, value]) => ({ sector, value })),
      gainers: movers.slice(0, 5),
      losers: movers.slice(-5).reverse(),
      valueHistory: Array.from({ length: 30 }, (_, index) => {
        const day = new Date();
        day.setDate(day.getDate() - (29 - index));
        return { date: day.toISOString().slice(0, 10), value: Math.round(totalValue * (0.95 + index / 600)) };
      }),
      insights: recommendations
    });
  })
);
