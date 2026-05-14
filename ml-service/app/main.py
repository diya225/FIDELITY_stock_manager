import os
from fastapi import Depends, FastAPI, Header, HTTPException
from dotenv import load_dotenv
from .engine import generate_recommendations, portfolio_score
from .models import PortfolioScoreRequest, RecommendationRequest, RecommendationResponse

load_dotenv()

app = FastAPI(title="Stock Manager ML Service", version="1.0.0")


def require_api_key(x_api_key: str | None = Header(default=None)):
    expected = os.getenv("API_KEY", "dev_ml_api_key_change_in_production")
    if x_api_key != expected:
        raise HTTPException(status_code=401, detail="Invalid API key")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/recommend", response_model=RecommendationResponse, dependencies=[Depends(require_api_key)])
def recommend(payload: RecommendationRequest):
    return {
        "recommendations": generate_recommendations(
            payload.stocks, payload.risk_appetite, payload.investable_amount
        )
    }


@app.post("/portfolio-score", dependencies=[Depends(require_api_key)])
def score_portfolio(payload: PortfolioScoreRequest):
    return portfolio_score(payload.holdings)
