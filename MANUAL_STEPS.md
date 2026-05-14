# Manual Steps Needed

Most of the project code is already generated in this workspace. These steps require your local tools or external accounts.

## 1. Fix Local Tooling

This Codex session can see `node`, but `npm` is not available on PATH. Python is also pointing to a blocked virtual environment.

Install or repair:

```powershell
node --version
npm --version
python --version
```

All three should print versions.

## 2. Install Dependencies

```powershell
npm install
cd ml-service
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

## 3. Configure Environment Files

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env.local
Copy-Item ml-service\.env.example ml-service\.env
```

For production, replace placeholders with your real Neon, SMTP, and Sentry values.

## 4. Start Database and Seed Data

```powershell
docker compose up postgres -d
npm run db:migrate
npm run db:seed
```

## 5. Run the App

Use three terminals:

```powershell
npm run dev -w backend
```

```powershell
npm run dev -w frontend
```

```powershell
cd ml-service
.\.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:3000`.

## 6. Verify Core Flow

1. Login with `rahul@demo.com` / `Demo1234!`.
2. Open Profile and save the financial profile.
3. Open Recommendations and click Refresh.
4. Buy one recommended stock.
5. Open Dashboard and Portfolio to confirm holdings and charts update.
