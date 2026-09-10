import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { User, AuthUserContext } from '../types/index.js';

const TOKEN_KEY =
  process.env.TOKEN_KEY ||
  'SIGAC_SuperSecretKey_Para_Desarrollo_2026_Universidad_Quevedo_JWT_Token_Key_Segura';

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(64).toString('hex');
  const hash = crypto.createHmac('sha512', Buffer.from(salt, 'hex')).update(password).digest('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const computed = crypto.createHmac('sha512', Buffer.from(salt, 'hex')).update(password).digest('hex');
    return computed === hash;
  } catch {
    return false;
  }
}

export function createToken(user: User): string {
  const roles = user.persona ? user.persona.roles : [];
  const primaryRole = roles[0] || user.persona?.rol || 'Estudiante';

  // Include both standard JWT claims and Microsoft/IdentityModel claim type mappings
  const payload = {
    nameid: String(user.id),
    sub: String(user.id),
    unique_name: user.username,
    role: roles.length === 1 ? primaryRole : roles,
    roles: roles,
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': String(user.id),
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': user.username,
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': roles.length === 1 ? primaryRole : roles,
  };

  return jwt.sign(payload, TOKEN_KEY, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthUserContext | null {
  try {
    const decoded = jwt.verify(token, TOKEN_KEY) as Record<string, any>;
    const idStr =
      decoded.nameid ||
      decoded.sub ||
      decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
    const username =
      decoded.unique_name ||
      decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
      '';

    let roles: string[] = [];
    const rawRole =
      decoded.role ||
      decoded.roles ||
      decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

    if (Array.isArray(rawRole)) {
      roles = rawRole.map(String);
    } else if (typeof rawRole === 'string' && rawRole.length > 0) {
      roles = rawRole.split(',').map((r) => r.trim());
    }

    const id = parseInt(idStr, 10);
    if (isNaN(id)) return null;

    return { id, username, roles };
  } catch {
    return null;
  }
}
