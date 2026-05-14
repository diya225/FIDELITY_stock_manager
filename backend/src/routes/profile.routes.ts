import { InvestmentGoal, RiskAppetite } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/config/prisma.js";
import { asyncHandler } from "@/middleware/asyncHandler.js";
import { requireAuth } from "@/middleware/auth.js";
import { calculateInvestableAmount, horizonByGoal } from "@/services/profile.service.js";
import { ok } from "@/utils/envelope.js";
import { AppError } from "@/utils/appError.js";

export const profileRouter = Router();
profileRouter.use(requireAuth);

const profileSchema = z
  .object({
    monthlyIncome: z.number().min(0).max(10_000_000),
    monthlyExpenses: z.number().min(0),
    currentSavings: z.number().min(0),
    investmentGoal: z.nativeEnum(InvestmentGoal),
    riskAppetite: z.nativeEnum(RiskAppetite)
  })
  .refine((data) => data.monthlyExpenses < data.monthlyIncome, {
    path: ["monthlyExpenses"],
    message: "Expenses must be lower than income"
  });

profileRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    const profile = await prisma.profile.findUnique({ where: { userId: req.user!.id } });
    ok(res, profile);
  })
);

profileRouter.put(
  "/me",
  asyncHandler(async (req, res) => {
    const body = profileSchema.parse(req.body);
    const horizonMonths = horizonByGoal[body.investmentGoal];
    const investableAmount = calculateInvestableAmount(
      body.monthlyIncome,
      body.monthlyExpenses,
      body.investmentGoal,
      body.riskAppetite
    );

    if (investableAmount < 500) {
      throw new AppError("Investable amount must be at least INR 500 before trading.", 400);
    }

    const profile = await prisma.profile.upsert({
      where: { userId: req.user!.id },
      update: { ...body, horizonMonths, investableAmount },
      create: { userId: req.user!.id, ...body, horizonMonths, investableAmount }
    });

    await prisma.portfolio.upsert({
      where: { userId: req.user!.id },
      update: { virtualBalance: investableAmount },
      create: { userId: req.user!.id, virtualBalance: investableAmount }
    });

    await prisma.recommendation.deleteMany({ where: { userId: req.user!.id } });
    ok(res, profile);
  })
);
