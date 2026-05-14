export type User = {
  id: string;
  email: string;
  fullName: string;
  role: "USER" | "ADMIN";
};

export type Stock = {
  id: string;
  ticker: string;
  name: string;
  sector: string;
  currentPrice: string;
  changePct: string;
};

export type Recommendation = {
  id: string;
  signal: "BUY" | "HOLD" | "SELL";
  suitabilityScore: number;
  confidence: string;
  suggestedAmount: string;
  explanation: string;
  stock: Stock;
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
