import { Router } from "express";
import { prisma } from "@/config/prisma.js";
import { asyncHandler } from "@/middleware/asyncHandler.js";
import { mlHealth } from "@/services/mlClient.js";
import { ok } from "@/utils/envelope.js";

export const healthRouter = Router();

healthRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const db = await prisma.$queryRaw`SELECT 1`.then(() => "connected").catch(() => "disconnected");
    const ml = await mlHealth().then(() => "connected").catch(() => "disconnected");
    ok(res, { status: "ok", db, ml });
  })
);
