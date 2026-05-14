import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { corsOrigins } from "@/config/env.js";
import { adminRouter } from "@/routes/admin.routes.js";
import { authRouter } from "@/routes/auth.routes.js";
import { dashboardRouter } from "@/routes/dashboard.routes.js";
import { healthRouter } from "@/routes/health.routes.js";
import { portfolioRouter } from "@/routes/portfolio.routes.js";
import { profileRouter } from "@/routes/profile.routes.js";
import { recommendationsRouter } from "@/routes/recommendations.routes.js";
import { stocksRouter } from "@/routes/stocks.routes.js";
import { errorHandler } from "@/middleware/errorHandler.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(rateLimit({ windowMs: 60_000, limit: 100 }));

app.use("/api/auth", rateLimit({ windowMs: 60_000, limit: 10 }), authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/stocks", stocksRouter);
app.use("/api/recommendations", recommendationsRouter);
app.use("/api/portfolio", portfolioRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/admin", adminRouter);
app.use("/api/health", healthRouter);

app.use(errorHandler);
