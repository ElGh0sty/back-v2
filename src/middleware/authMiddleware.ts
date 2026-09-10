import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/tokenService.js';
import type { AuthUserContext } from '../types/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserContext;
    }
  }
}

export function extractAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const user = verifyToken(token);
    if (user) {
      req.user = user;
    }
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'No autorizado. Se requiere token Bearer válido.' });
  }
  next();
}

export function requireRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autorizado.' });
    }

    const userRoles = req.user.roles.map((r) => r.toLowerCase());
    const allowedRoles = roles.map((r) => r.toLowerCase());

    const hasRole = userRoles.some((ur) => allowedRoles.includes(ur));
    if (!hasRole) {
      return res.status(403).json({
        message: `Acceso denegado. Se requiere uno de los siguientes roles: ${roles.join(', ')}.`,
      });
    }

    next();
  };
}
