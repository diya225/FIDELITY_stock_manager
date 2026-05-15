export type User = {
  id: string;
  email: string;
  fullName: string;
  role: "USER" | "ADMIN";
  isActive?: boolean;
  createdAt?: string;
};

export type Stock = {
  id: string;
  ticker: string;
  name: string;
  sector: string;
  exchange?: string;
  currentPrice: string;
  changePct: string;
  isActive?: boolean;
};

export type Recommendation = {
  id: string;
  signal: "BUY" | "HOLD" | "SELL";
  suitabilityScore: number;
  confidence: string;
  suggestedAmount: string;
  explanation: string;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH";
  volatility?: number;
  stock: Stock;
};

export type Profile = {
  id: string;
  monthlyIncome: string;
  monthlyExpenses: string;
  currentSavings: string;
  investmentGoal: "SHORT_TERM" | "MEDIUM_TERM" | "LONG_TERM";
  riskAppetite: "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE";
  investableAmount: string;
};

export type Holding = {
  id: string;
  quantity: number;
  averageBuyPrice: string;
  stock: Stock;
};

export type Portfolio = {
  id: string;
  virtualBalance: string;
  holdings: Holding[];
  transactions: Array<{ id: string; type: "BUY" | "SELL"; quantity: number; price: string; tradeValue: string; stock: Stock }>;
};
