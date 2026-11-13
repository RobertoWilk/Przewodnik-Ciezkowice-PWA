import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthPayload } from './types.js';

export interface AuthedRequest extends Request {
  user?: AuthPayload;
}

const jwtSecret = () => process.env.JWT_SECRET ?? 'dev-secret-change-me';

export function signToken(payload: AuthPayload) {
  return jwt.sign(payload, jwtSecret(), { expiresIn: '7d' });
}

export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const token = getBearer(req);
  if (!token) return next();

  try {
    req.user = jwt.verify(token, jwtSecret()) as unknown as AuthPayload;
  } catch {
    // Użytkownik publiczny nadal może korzystać z aplikacji.
  }
  next();
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = getBearer(req);
  if (!token) return res.status(401).json({ message: 'Brak tokenu logowania.' });

  try {
    req.user = jwt.verify(token, jwtSecret()) as unknown as AuthPayload;
    next();
  } catch {
    res.status(401).json({ message: 'Nieprawidłowy albo wygasły token.' });
  }
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień administratora.' });
    }
    next();
  });
}

export function requireManager(req: AuthedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'moderator') {
      return res.status(403).json({ message: 'Brak uprawnień administratora lub moderatora.' });
    }
    next();
  });
}

function getBearer(req: Request) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return undefined;
  return header.slice('Bearer '.length);
}
