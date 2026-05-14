from pydantic import BaseModel, Field


class StockInput(BaseModel):
    ticker: str
    name: str
    sector: str
    current_price: float = Field(ge=0)
    change_pct: float


class RecommendationRequest(BaseModel):
    risk_appetite: str
    investment_goal: str
    investable_amount: float = Field(ge=0)
    stocks: list[StockInput]


class Recommendation(BaseModel):
    ticker: str
    signal: str
    suitability_score: int
    confidence: float
    suggested_amount: float
    explanation: str


class RecommendationResponse(BaseModel):
    recommendations: list[Recommendation]


class HoldingInput(BaseModel):
    ticker: str
    sector: str
    quantity: int
    average_buy_price: float
    current_price: float


class PortfolioScoreRequest(BaseModel):
    holdings: list[HoldingInput]
