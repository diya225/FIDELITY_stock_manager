import { InvestmentGoal, RiskAppetite } from "@prisma/client";

export const horizonByGoal: Record<InvestmentGoal, number> = {
  SHORT_TERM: 12,
  MEDIUM_TERM: 24,
  LONG_TERM: 60
};

export const allocationByRisk: Record<RiskAppetite, number> = {
  CONSERVATIVE: 0.1,
  MODERATE: 0.2,
  AGGRESSIVE: 0.3
};

export const calculateInvestableAmount = (
  monthlyIncome: number,
  monthlyExpenses: number,
  investmentGoal: InvestmentGoal,
  riskAppetite: RiskAppetite
) => {
  const surplus = Math.max(monthlyIncome - monthlyExpenses, 0);
  return surplus * allocationByRisk[riskAppetite] * horizonByGoal[investmentGoal];
};
