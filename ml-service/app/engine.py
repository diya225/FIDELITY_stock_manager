from .models import HoldingInput, Recommendation, StockInput


RISK_BONUS = {
    "CONSERVATIVE": {"FMCG": 8, "Pharma": 6, "Banking": 4},
    "MODERATE": {"IT": 6, "Banking": 6, "Energy": 4},
    "AGGRESSIVE": {"Automobile": 8, "Metals": 8, "NBFC": 6, "Infrastructure": 5},
}


def score_stock(stock: StockInput, risk_appetite: str) -> int:
    momentum = max(min(stock.change_pct * 4, 16), -16)
    base = 58 + momentum
    sector_bonus = RISK_BONUS.get(risk_appetite, {}).get(stock.sector, 0)
    price_bonus = 5 if stock.current_price > 0 else -30
    return int(max(0, min(100, round(base + sector_bonus + price_bonus))))


def signal_for_score(score: int) -> str:
    if score >= 70:
        return "BUY"
    if score >= 45:
        return "HOLD"
    return "SELL"


def generate_recommendations(stocks: list[StockInput], risk_appetite: str, investable_amount: float) -> list[Recommendation]:
    ranked = sorted(stocks, key=lambda stock: score_stock(stock, risk_appetite), reverse=True)
    recommendations: list[Recommendation] = []
    for stock in ranked[:15]:
        score = score_stock(stock, risk_appetite)
        signal = signal_for_score(score)
        confidence = round(0.55 + score / 220, 2)
        suggested = round(max(0, investable_amount) * (score / 100) / 10, 2)
        direction = "positive momentum" if stock.change_pct >= 0 else "short-term weakness"
        recommendations.append(
            Recommendation(
                ticker=stock.ticker,
                signal=signal,
                suitability_score=score,
                confidence=min(confidence, 0.96),
                suggested_amount=suggested,
                explanation=(
                    f"{stock.name} shows {direction} at {stock.change_pct:.2f}% today. "
                    f"The {stock.sector} exposure fits a {risk_appetite.lower()} profile with a suitability score of {score}."
                ),
            )
        )
    return recommendations


def portfolio_score(holdings: list[HoldingInput]) -> dict:
    if not holdings:
        return {
            "score": 0,
            "predicted_pnl": 0,
            "dimensions": {"diversification": 0, "risk": 0, "profitability": 0, "volatility": 0, "consistency": 0},
        }

    total_value = sum(item.quantity * item.current_price for item in holdings)
    invested = sum(item.quantity * item.average_buy_price for item in holdings)
    sectors = {item.sector for item in holdings}
    diversification = min(100, len(sectors) * 20)
    profitability = max(0, min(100, 50 + ((total_value - invested) / max(invested, 1)) * 200))
    concentration = max((item.quantity * item.current_price) / max(total_value, 1) for item in holdings)
    risk = max(0, 100 - concentration * 70)
    volatility = 70 if len(holdings) >= 4 else 45
    consistency = 65 + min(20, len(holdings) * 3)
    score = round((diversification + profitability + risk + volatility + consistency) / 5)
    predicted_pnl = round(total_value * ((score - 45) / 1000), 2)
    return {
        "score": int(score),
        "predicted_pnl": predicted_pnl,
        "dimensions": {
            "diversification": round(diversification),
            "risk": round(risk),
            "profitability": round(profitability),
            "volatility": round(volatility),
            "consistency": round(consistency),
        },
    }
