import numpy as np
import pandas as pd


def sma(values: list[float], window: int) -> float:
    series = pd.Series(values)
    return float(series.rolling(window).mean().iloc[-1])


def rsi(values: list[float], window: int = 14) -> float:
    series = pd.Series(values)
    delta = series.diff()
    gains = delta.clip(lower=0).rolling(window).mean()
    losses = (-delta.clip(upper=0)).rolling(window).mean()
    rs = gains / losses.replace(0, np.nan)
    value = 100 - (100 / (1 + rs.iloc[-1]))
    return 50.0 if np.isnan(value) else float(value)


def macd(values: list[float]) -> tuple[float, float]:
    series = pd.Series(values)
    fast = series.ewm(span=12, adjust=False).mean()
    slow = series.ewm(span=26, adjust=False).mean()
    macd_line = fast - slow
    signal = macd_line.ewm(span=9, adjust=False).mean()
    return float(macd_line.iloc[-1]), float(signal.iloc[-1])


def bollinger_position(values: list[float], window: int = 20) -> float:
    series = pd.Series(values)
    mean = series.rolling(window).mean().iloc[-1]
    std = series.rolling(window).std().iloc[-1]
    if not std or np.isnan(std):
        return 0.5
    upper = mean + 2 * std
    lower = mean - 2 * std
    return float((series.iloc[-1] - lower) / (upper - lower))


def atr(high: list[float], low: list[float], close: list[float], window: int = 14) -> float:
    highs = pd.Series(high)
    lows = pd.Series(low)
    closes = pd.Series(close)
    previous_close = closes.shift(1)
    tr = pd.concat([(highs - lows), (highs - previous_close).abs(), (lows - previous_close).abs()], axis=1).max(axis=1)
    return float(tr.rolling(window).mean().iloc[-1])
