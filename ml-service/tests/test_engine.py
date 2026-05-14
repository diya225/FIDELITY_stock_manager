from app.engine import generate_recommendations, portfolio_score
from app.models import HoldingInput, StockInput


def test_generate_recommendations_returns_sorted_scores():
    stocks = [
        StockInput(ticker="A.NS", name="A", sector="IT", current_price=100, change_pct=2),
        StockInput(ticker="B.NS", name="B", sector="Metals", current_price=100, change_pct=-2),
    ]
    recs = generate_recommendations(stocks, "MODERATE", 10000)
    assert recs[0].suitability_score >= recs[1].suitability_score
    assert recs[0].signal in {"BUY", "HOLD", "SELL"}


def test_portfolio_score_empty():
    assert portfolio_score([])["score"] == 0


def test_portfolio_score_with_holdings():
    result = portfolio_score(
        [
            HoldingInput(ticker="A.NS", sector="IT", quantity=2, average_buy_price=90, current_price=100),
            HoldingInput(ticker="B.NS", sector="FMCG", quantity=1, average_buy_price=100, current_price=98),
        ]
    )
    assert result["score"] > 0
