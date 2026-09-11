import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../config/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendSuccess } from '../utils/response';
import { UnauthorizedError, NotFoundError } from '../utils/errors';
import { config } from '../config/config';
import { asyncHandler } from '../middleware/error.middleware';

const REFRESH_COOKIE_NAME = 'refreshToken';

const cookieOptions = {
  httpOnly: true,       // NOT accessible via document.cookie — XSS protection
  secure: config.nodeEnv === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth',
};

/**
 * POST /api/auth/login
 * Validates credentials, issues access token in body + refresh token in HttpOnly cookie.
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new UnauthorizedError('Invalid email or password');

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) throw new UnauthorizedError('Invalid email or password');

  // Generate tokens
  const tokenId = crypto.randomUUID();
  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });
  const refreshTokenStr = signRefreshToken({ userId: user.id, tokenId });

  // Store hashed refresh token in DB (so we can revoke it)
  const tokenHash = crypto.createHash('sha256').update(refreshTokenStr).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { id: tokenId, userId: user.id, tokenHash, expiresAt },
  });

  // Update online status
  await prisma.user.update({ where: { id: user.id }, data: { isOnline: true } });

  // Set HttpOnly cookie
  res.cookie(REFRESH_COOKIE_NAME, refreshTokenStr, cookieOptions);

  sendSuccess(res, {
    accessToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  }, 'Login successful');
});

/**
 * POST /api/auth/refresh
 * Reads refresh token from HttpOnly cookie, validates against DB, rotates token pair.
 */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!rawToken) throw new UnauthorizedError('Refresh token not found');

  let payload;
  try {
    payload = verifyRefreshToken(rawToken);
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    // Possible token reuse attack — revoke all user tokens
    await prisma.refreshToken.updateMany({
      where: { userId: payload.userId },
      data: { revoked: true },
    });
    throw new UnauthorizedError('Refresh token invalid or reused');
  }

  // Revoke old token (rotation)
  await prisma.refreshToken.update({ where: { tokenHash }, data: { revoked: true } });

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) throw new NotFoundError('User');

  // Issue new token pair
  const newTokenId = crypto.randomUUID();
  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });
  const newRefreshToken = signRefreshToken({ userId: user.id, tokenId: newTokenId });
  const newTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

  await prisma.refreshToken.create({
    data: {
      id: newTokenId,
      userId: user.id,
      tokenHash: newTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, cookieOptions);
  sendSuccess(res, {
    accessToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  }, 'Token refreshed');
});

/**
 * POST /api/auth/logout
 * Revokes refresh token and clears cookie.
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];

  if (rawToken) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await prisma.refreshToken.updateMany({ where: { tokenHash }, data: { revoked: true } });
  }

  if (req.user) {
    await prisma.user.update({ where: { id: req.user.userId }, data: { isOnline: false } });
  }

  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
  sendSuccess(res, null, 'Logged out successfully');
});

/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile.
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true, email: true, name: true, role: true,
      isOnline: true, lastSeen: true, createdAt: true,
    },
  });
  if (!user) throw new NotFoundError('User');
  sendSuccess(res, user);
});
