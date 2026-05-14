import { Response } from "express";

export const ok = <T>(res: Response, data: T, status = 200, meta?: unknown) =>
  res.status(status).json({ success: true, data, ...(meta ? { meta } : {}) });
