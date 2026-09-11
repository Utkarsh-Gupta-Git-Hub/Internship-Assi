import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, AccessTokenPayload } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

/**
 * Authenticates requests by verifying the Bearer JWT in the Authorization header.
 * On success, attaches decoded payload to req.user.
 * On failure, throws UnauthorizedError — no sensitive JWT error details exposed.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authorization header missing or malformed');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error: unknown) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      // Don't expose JWT error details (expired, malformed, etc.)
      next(new UnauthorizedError('Invalid or expired token'));
    }
  }
}
