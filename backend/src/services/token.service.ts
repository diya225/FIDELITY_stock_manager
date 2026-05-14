import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Role, User } from "@prisma/client";
import { prisma } from "@/config/prisma.js";
import { env } from "@/config/env.js";

const refreshDays = 7;

export const signAccessToken = (user: Pick<User, "id" | "email" | "role">) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN
  });

export const createRefreshToken = async (userId: string) => {
  const token = crypto.randomBytes(48).toString("hex");
  const tokenHash = await bcrypt.hash(token, 12);
  const expiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt }
  });

  return token;
};

export const rotateRefreshToken = async (plainToken: string) => {
  const tokens = await prisma.refreshToken.findMany({
    where: { expiresAt: { gt: new Date() } },
    include: { user: true }
  });

  for (const row of tokens) {
    const matches = await bcrypt.compare(plainToken, row.tokenHash);
    if (matches) {
      await prisma.refreshToken.delete({ where: { id: row.id } });
      const accessToken = signAccessToken(row.user);
      const refreshToken = await createRefreshToken(row.userId);
      return { accessToken, refreshToken, user: sanitizeUser(row.user) };
    }
  }

  return null;
};

export const sanitizeUser = (user: Pick<User, "id" | "email" | "fullName" | "role">) => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  role: user.role as Role
});
