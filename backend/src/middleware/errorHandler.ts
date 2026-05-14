import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "@/utils/appError.js";
import { logger } from "@/config/logger.js";

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      details: error.flatten()
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      ...(error.details ? { details: error.details } : {})
    });
  }

  logger.error({ message: error.message, stack: error.stack });
  return res.status(500).json({ success: false, error: "Internal server error" });
};
