import { Signal, StockPrice } from "@prisma/client";

type PricePoint = Pick<StockPrice, "close" | "high" | "low">;

const closes = (prices: PricePoint[]) => prices.map((price) => Number(price.close));

export const latestClose = (prices: PricePoint[]) => Number(prices.at(-1)?.close ?? 0);

export const changePctFromHistory = (prices: PricePoint[]) => {
  if (prices.length < 2) return 0;
  const previous = Number(prices.at(-2)?.close ?? 0);
  const latest = latestClose(prices);
  return previous > 0 ? ((latest - previous) / previous) * 100 : 0;
};

export const volatilityPct = (prices: PricePoint[]) => {
  const values = closes(prices).slice(-60);
  if (values.length < 2) return 0;
  const returns = values.slice(1).map((value, index) => (value - values[index]) / Math.max(values[index], 1));
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
};

export const riskLevelFromVolatility = (volatility: number) => {
  if (volatility < 18) return "LOW";
  if (volatility < 32) return "MEDIUM";
  return "HIGH";
};

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);

const rsi = (values: number[]) => {
  const window = values.slice(-15);
  if (window.length < 15) return 50;
  let gains = 0;
  let losses = 0;
  for (let index = 1; index < window.length; index += 1) {
    const change = window[index] - window[index - 1];
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }
  if (losses === 0) return 100;
  const relativeStrength = gains / losses;
  return 100 - 100 / (1 + relativeStrength);
};

export const signalFromHistory = (
  prices: PricePoint[],
  riskAppetite: string,
  investmentGoal: string,
  sector: string
) => {
  const values = closes(prices);
  const latest = values.at(-1) ?? 0;
  const sma20 = average(values.slice(-20));
  const sma50 = average(values.slice(-50));
  const momentum = values.length >= 45 ? ((latest - values.at(-45)!) / Math.max(values.at(-45)!, 1)) * 100 : 0;
  const stockRsi = rsi(values);
  const volatility = volatilityPct(prices);
  const riskLevel = riskLevelFromVolatility(volatility);
  const riskFit =
    (riskAppetite === "CONSERVATIVE" && riskLevel === "LOW") ||
    (riskAppetite === "MODERATE" && riskLevel !== "HIGH") ||
    riskAppetite === "AGGRESSIVE"
      ? 10
      : -10;
  const sectorFit =
    riskAppetite === "CONSERVATIVE" && ["FMCG", "Pharma", "Banking"].includes(sector)
      ? 6
      : riskAppetite === "AGGRESSIVE" && ["Automobile", "Metals", "Infrastructure", "NBFC"].includes(sector)
        ? 6
        : 2;
  const horizonFit = investmentGoal === "LONG_TERM" ? 4 : investmentGoal === "MEDIUM_TERM" ? 2 : 0;
  const trendScore = latest > sma20 ? 8 : -8;
  const longTrendScore = sma20 > sma50 ? 8 : -4;
  const rsiScore = stockRsi < 35 ? 7 : stockRsi > 72 ? -8 : 3;
  const momentumScore = Math.max(-12, Math.min(12, momentum * 1.2));
  const suitabilityScore = Math.max(
    15,
    Math.min(95, Math.round(52 + riskFit + sectorFit + horizonFit + trendScore + longTrendScore + rsiScore + momentumScore))
  );
  const signal: Signal = suitabilityScore >= 68 ? "BUY" : suitabilityScore >= 48 ? "HOLD" : "SELL";

  return {
    signal,
    suitabilityScore,
    confidence: Number((0.58 + Math.min(0.35, Math.abs(suitabilityScore - 50) / 140)).toFixed(2)),
    riskLevel,
    volatility: Number(volatility.toFixed(2)),
    momentum: Number(momentum.toFixed(2)),
    rsi: Number(stockRsi.toFixed(2))
  };
};
