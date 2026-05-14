# AI-Powered Stock Portfolio Manager

Full-stack demo implementation of the attached specification: a Next.js frontend, Express/Prisma API, FastAPI recommendation service, and PostgreSQL database.

## Apps

- `frontend`: Next.js 14 App Router dashboard UI.
- `backend`: Express API with auth, profile, stocks, recommendations, portfolio, dashboard, and health modules.
- `ml-service`: FastAPI service with technical indicators, stock recommendations, portfolio scoring, and predicted P&L.

## Local Setup

1. Install Node.js with npm available on PATH.
2. Install Python 3.11+.
3. Copy env files:
   - `backend/.env.example` to `backend/.env`
   - `frontend/.env.example` to `frontend/.env.local`
   - `ml-service/.env.example` to `ml-service/.env`
4. Start Postgres:

```bash
docker compose up postgres -d
```

5. Install dependencies:

```bash
npm install
cd ml-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

6. Prepare the database:

```bash
npm run db:migrate
npm run db:seed
```

7. Run services in three terminals:

```bash
npm run dev -w backend
npm run dev -w frontend
cd ml-service && uvicorn app.main:app --reload --port 8000
```

Frontend: `http://localhost:3000`

Backend health: `http://localhost:3001/api/health`

ML health: `http://localhost:8000/health`

## Demo Accounts

- `rahul@demo.com` / `Demo1234!`
- `priya@demo.com` / `Demo1234!`
- `admin@stockmanager.app` / `Admin1234!`

## Manual Work Needed

- Create a production PostgreSQL database on Neon or another provider and set `DATABASE_URL`.
- Configure SMTP credentials if password reset email delivery is required.
- Configure Sentry DSNs if production error tracking is required.
- Deploy `frontend`, `backend`, and `ml-service` separately using the env vars in each `.env.example`.
