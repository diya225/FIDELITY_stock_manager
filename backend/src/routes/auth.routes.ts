import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/config/prisma.js";
import { asyncHandler } from "@/middleware/asyncHandler.js";
import { AppError } from "@/utils/appError.js";
import { ok } from "@/utils/envelope.js";
import { createRefreshToken, rotateRefreshToken, sanitizeUser, signAccessToken } from "@/services/token.service.js";

export const authRouter = Router();

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

const passwordSchema = z
  .string()
  .min(8)
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number")
  .regex(/[^A-Za-z0-9]/, "Password must contain a special character");

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        fullName: z.string().min(2),
        email: z.string().email(),
        password: passwordSchema,
        confirmPassword: z.string()
      })
      .refine((data) => data.password === data.confirmPassword, {
        path: ["confirmPassword"],
        message: "Passwords do not match"
      })
      .parse(req.body);

    const exists = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (exists) {
      throw new AppError("Email already registered", 409);
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        fullName: body.fullName,
        passwordHash
      }
    });
    const accessToken = signAccessToken(user);
    const refreshToken = await createRefreshToken(user.id);
    res.cookie("refreshToken", refreshToken, cookieOptions);
    ok(res, { user: sanitizeUser(user), accessToken }, 201);
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const body = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    const genericError = new AppError("Invalid credentials", 401);

    if (!user || !user.isActive) {
      throw genericError;
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AppError("Account temporarily locked. Try again later.", 423);
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      const failedLogins = user.failedLogins + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLogins,
          lockedUntil: failedLogins >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null
        }
      });
      throw genericError;
    }

    await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
    const accessToken = signAccessToken(user);
    const refreshToken = await createRefreshToken(user.id);
    res.cookie("refreshToken", refreshToken, cookieOptions);
    ok(res, { user: sanitizeUser(user), accessToken });
  })
);

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const token = req.cookies.refreshToken as string | undefined;
    if (!token) {
      throw new AppError("Refresh token missing", 401);
    }
    const rotated = await rotateRefreshToken(token);
    if (!rotated) {
      throw new AppError("Invalid refresh token", 401);
    }
    res.cookie("refreshToken", rotated.refreshToken, cookieOptions);
    ok(res, { user: rotated.user, accessToken: rotated.accessToken });
  })
);

authRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const token = req.cookies.refreshToken as string | undefined;
    if (token) {
      const tokens = await prisma.refreshToken.findMany();
      for (const row of tokens) {
        if (await bcrypt.compare(token, row.tokenHash)) {
          await prisma.refreshToken.delete({ where: { id: row.id } });
          break;
        }
      }
    }
    res.clearCookie("refreshToken");
    ok(res, { loggedOut: true });
  })
);
