import axios from "axios";
import { env } from "@/config/env.js";

const client = axios.create({
  baseURL: env.ML_SERVICE_URL,
  timeout: 8000,
  headers: { "x-api-key": env.ML_SERVICE_API_KEY }
});

export type MlRecommendation = {
  ticker: string;
  signal: "BUY" | "HOLD" | "SELL";
  suitability_score: number;
  confidence: number;
  suggested_amount: number;
  explanation: string;
};

export const requestRecommendations = async (payload: {
  risk_appetite: string;
  investment_goal: string;
  investable_amount: number;
  stocks: Array<{ ticker: string; name: string; sector: string; current_price: number; change_pct: number }>;
}) => {
  const { data } = await client.post<{ recommendations: MlRecommendation[] }>("/recommend", payload);
  return data.recommendations;
};

export const requestPortfolioScore = async (payload: {
  holdings: Array<{ ticker: string; sector: string; quantity: number; average_buy_price: number; current_price: number }>;
}) => {
  const { data } = await client.post<{ score: number; predicted_pnl: number; dimensions: Record<string, number> }>(
    "/portfolio-score",
    payload
  );
  return data;
};

export const mlHealth = async () => {
  const { data } = await client.get("/health");
  return data;
};
