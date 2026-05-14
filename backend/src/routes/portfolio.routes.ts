import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/config/prisma.js";
import { asyncHandler } from "@/middleware/asyncHandler.js";
import { requireAuth } from "@/middleware/auth.js";
import { ok } from "@/utils/envelope.js";
import { AppError } from "@/utils/appError.js";

export const portfolioRouter = Router();
portfolioRouter.use(requireAuth);

const getPortfolio = async (userId: string) => {
  const portfolio = await prisma.portfolio.findUnique({
    where: { userId },
    include: {
      holdings: { include: { stock: true }, orderBy: { updatedAt: "desc" } },
      transactions: { include: { stock: true }, orderBy: { createdAt: "desc" }, take: 30 }
    }
  });
  if (!portfolio) {
    throw new AppError("Portfolio not found. Complete your profile first.", 404);
  }
  return portfolio;
};

portfolioRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    ok(res, await getPortfolio(req.user!.id));
  })
);

portfolioRouter.post(
  "/buy",
  asyncHandler(async (req, res) => {
    const body = z.object({ ticker: z.string(), quantity: z.number().int().positive() }).parse(req.body);
    const portfolio = await getPortfolio(req.user!.id);
    const stock = await prisma.stock.findUnique({ where: { ticker: body.ticker } });
    if (!stock || Number(stock.currentPrice) <= 0) {
      throw new AppError("Price data unavailable", 400);
    }

    const price = Number(stock.currentPrice);
    const tradeValue = price * body.quantity;
    if (tradeValue > Number(portfolio.virtualBalance)) {
      throw new AppError("Insufficient funds", 400, { remainingBalance: Number(portfolio.virtualBalance) });
    }

    const existing = portfolio.holdings.find((holding) => holding.stockId === stock.id);
    await prisma.$transaction(async (tx) => {
      if (existing) {
        const totalQuantity = existing.quantity + body.quantity;
        const totalCost = Number(existing.averageBuyPrice) * existing.quantity + tradeValue;
        await tx.holding.update({
          where: { id: existing.id },
          data: { quantity: totalQuantity, averageBuyPrice: totalCost / totalQuantity }
        });
      } else {
        await tx.holding.create({
          data: {
            portfolioId: portfolio.id,
            stockId: stock.id,
            quantity: body.quantity,
            averageBuyPrice: price
          }
        });
      }

      await tx.transaction.create({
        data: { portfolioId: portfolio.id, stockId: stock.id, type: "BUY", quantity: body.quantity, price, tradeValue }
      });
      await tx.portfolio.update({
        where: { id: portfolio.id },
        data: { virtualBalance: Number(portfolio.virtualBalance) - tradeValue }
      });
    });

    ok(res, await getPortfolio(req.user!.id), 201);
  })
);

portfolioRouter.post(
  "/sell",
  asyncHandler(async (req, res) => {
    const body = z.object({ ticker: z.string(), quantity: z.number().int().positive() }).parse(req.body);
    const portfolio = await getPortfolio(req.user!.id);
    const holding = portfolio.holdings.find((candidate) => candidate.stock.ticker === body.ticker);
    if (!holding || holding.quantity < body.quantity) {
      throw new AppError("Cannot sell more shares than held", 400);
    }

    const price = Number(holding.stock.currentPrice);
    const tradeValue = price * body.quantity;
    const realizedPnl = (price - Number(holding.averageBuyPrice)) * body.quantity;

    await prisma.$transaction(async (tx) => {
      if (holding.quantity === body.quantity) {
        await tx.holding.delete({ where: { id: holding.id } });
      } else {
        await tx.holding.update({ where: { id: holding.id }, data: { quantity: holding.quantity - body.quantity } });
      }

      await tx.transaction.create({
        data: {
          portfolioId: portfolio.id,
          stockId: holding.stockId,
          type: "SELL",
          quantity: body.quantity,
          price,
          tradeValue,
          realizedPnl
        }
      });
      await tx.portfolio.update({
        where: { id: portfolio.id },
        data: { virtualBalance: Number(portfolio.virtualBalance) + tradeValue }
      });
    });

    ok(res, await getPortfolio(req.user!.id));
  })
);
