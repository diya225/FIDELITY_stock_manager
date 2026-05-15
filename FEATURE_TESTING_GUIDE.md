# Stock Manager Feature Testing Guide

Use this checklist after starting the full stack with the seeded database.

## Setup

1. Copy each `.env.example` file to `.env` in `backend`, `frontend`, and `ml-service`.
2. Start Postgres and services with Docker or your local setup.
3. Run database migration and seed:

```bash
npm run db:migrate
npm run db:seed
```

4. Start the app:

```bash
npm run dev
```

Default URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001/api`
- ML service: usually `http://localhost:8000`

Demo accounts:

- User: `rahul@demo.com` / `Demo1234!`
- User: `priya@demo.com` / `Demo1234!`
- Admin: `admin@stockmanager.app` / `Admin1234!`

## Historical Dataset Requirements

1. After seeding, confirm the dataset contains at least 20 active stocks:

```bash
npm run prisma:seed -w backend
```

2. In the app, log in and refresh recommendations. This confirms the app can generate stock signals from seeded historical data without any live market API.
3. Confirm the seeded stocks use NSE-style tickers such as `TCS.NS`, `INFY.NS`, `RELIANCE.NS`, and `HDFCBANK.NS`.
4. Confirm virtual trade prices match the latest available historical price shown in recommendations or portfolio.

## Authentication

1. Open `http://localhost:3000/register`.
2. Register with a unique email and a password with at least 8 characters, one uppercase letter, one number, and one special character.
3. Confirm successful redirect to `/profile/setup`.
4. Log out, then sign in from `/login`.
5. Try a wrong password several times and confirm the app rejects invalid credentials.

## Financial Profile And Investable Amount

1. Go to `Profile`.
2. Enter monthly income, expenses, and current savings where expenses are lower than income.
3. Continue through investment goal and risk appetite.
4. Confirm the final step shows a calculated virtual investable amount.
5. Try expenses greater than or equal to income and confirm the form blocks progress.
6. Use the affordability simulator to change monthly income and confirm the estimated investable capacity changes.
7. Save the profile and confirm you are redirected to `Recommendations`.
8. Return to `Profile` and confirm the saved profile loads with the saved investable amount message.

## Recommendations

1. Click `Refresh` to generate recommendations from seeded historical OHLCV data.
2. Confirm recommendations are generated even if no live market API is configured.
3. Confirm each recommendation shows ticker, company, BUY/HOLD/SELL signal, suitability score, confidence, suggested amount, current historical price, sector, risk level, and explanation.
4. Confirm explanations mention historical indicators such as momentum, RSI, or volatility.
5. Confirm the default view focuses on BUY recommendations.
6. Search by ticker, for example `TCS.NS`, and confirm the list filters.
7. Filter by `BUY`, `HOLD`, and `SELL`.
8. Filter by sector.
9. Filter by Low, Medium, and High risk level.
10. Click `Buy 1` on a BUY recommendation and confirm the portfolio updates.

## Portfolio Trading

1. Go to `Portfolio`.
2. Confirm market value, cash balance, and holdings count are visible.
3. Confirm each holding shows ticker, company, quantity, average buy price, current price, and profit/loss.
4. Confirm BUY price is taken from the latest seeded historical close price.
5. Confirm P&L follows `(latest historical price - average buy price) x quantity`.
6. Click `Sell 1` for a holding and confirm quantity or holdings count decreases.
7. Keep selling until a holding is gone and confirm the cash balance increases.
8. Confirm the app shows an error if a sell request cannot be completed.

## Dashboard Insights

1. Go to `Dashboard`.
2. Confirm the summary shows portfolio plus cash, predicted 30-day P&L, holdings, virtual balance, and score.
3. Confirm the portfolio value chart renders from seeded historical prices.
4. Confirm sector allocation renders.
5. Confirm Top BUY Ideas, Gainers, and Losers render after holdings and recommendations exist.

## Admin Features

1. Log in as `admin@stockmanager.app`.
2. Go to `Admin`.
3. Confirm users are listed with role and active status.
4. Deactivate a non-admin user, then reactivate the user.
5. Update a stock current price and change percent, then save.
6. Toggle a stock inactive and save.
7. Log in as a normal user and refresh recommendations. Confirm inactive stocks are not included.
8. Reactivate the stock from the admin screen.

## Requirement Acceptance Checklist

Use this final checklist before submission:

- Registration and JWT login work.
- Profile setup saves income, expenses, savings, goal, and risk appetite.
- Investable amount is calculated and displayed.
- Recommendations are generated from seeded historical data.
- BUY recommendations include suitability score, suggested amount, and future guidance.
- Recommendation page supports search, signal, sector, and risk filters.
- Virtual BUY and SELL trades work using historical price replay.
- Portfolio P&L and cash balance update after trades.
- Dashboard shows value history, sector allocation, gainers, losers, and summary cards.
- UI is responsive on mobile and desktop.
- Light/dark mode works and persists after refresh.

## Light And Dark Mode

1. Use the switch in the sidebar.
2. Confirm the entire dashboard changes between light and dark mode.
3. Refresh the browser and confirm the selected theme persists.
4. Check the dashboard, recommendations, portfolio, profile, and admin screens in both modes.

## Mobile Responsiveness

1. Open browser dev tools and test at widths around `390px`, `768px`, and desktop.
2. Confirm navigation remains usable.
3. Confirm cards, forms, charts, and admin rows do not overlap or clip text.
4. Test buying, selling, filtering, and theme switching on the small viewport.
