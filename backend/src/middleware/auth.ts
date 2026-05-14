import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "@/config/env.js";
import { AppError } from "@/utils/appError.js";

export type AuthUser = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
};

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    throw new AppError("Authentication required", 401);
  }

  try {
    req.user = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthUser;
    next();
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }
};

export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (req.user?.role !== "ADMIN") {
    throw new AppError("Admin access required", 403);
  }
  next();
};
