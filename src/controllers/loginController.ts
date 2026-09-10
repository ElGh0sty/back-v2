import { Router } from 'express';
import { mockStore } from '../data/mockStore.js';
import { hashPassword, verifyPassword, createToken } from '../services/tokenService.js';
import type { User, Persona } from '../types/index.js';

export const loginRouter = Router();

// POST /api/Login/register and /api/login/register
loginRouter.post('/register', (req, res) => {
  const { username, password, nombre, apellido, correo, roles, rol } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: 'Username y password requeridos.' });
  }

  let requestedRoles: string[] = [];
  if (Array.isArray(roles)) {
    requestedRoles.push(...roles.filter(Boolean));
  }
  if (rol && typeof rol === 'string') {
    requestedRoles.push(...rol.split(',').map((r) => r.trim()).filter(Boolean));
  }

  requestedRoles = Array.from(new Set(requestedRoles.map((r) => r.trim()))).filter(Boolean);

  if (requestedRoles.length === 0) {
    return res.status(400).json({ message: 'Debe indicar al menos un rol válido.' });
  }

  const normalizedUsername = username.trim().toLowerCase();
  const exists = mockStore.users.some((u) => u.username.toLowerCase() === normalizedUsername);
  if (exists) {
    return res.status(400).json({ message: 'Username is already taken' });
  }

  // Hierarchy validation
  if (mockStore.users.length === 0) {
    const hasAdmin = requestedRoles.some((r) => r.toLowerCase() === 'administrador');
    if (!hasAdmin) {
      return res.status(400).json({ message: 'El primer usuario debe ser Administrador.' });
    }
  } else {
    if (!req.user) {
      return res.status(401).json({ message: 'Sólo usuarios autenticados pueden crear cuentas.' });
    }

    const callerRole = req.user.roles[0] || '';
    const allowedTargetsMap: Record<string, string[]> = {
      administrador: ['administrador', 'decano', 'coordinador', 'docente', 'estudiante', 'jurado'],
      decano: ['coordinador', 'docente', 'estudiante', 'jurado'],
      coordinador: ['docente', 'estudiante', 'jurado'],
      docente: ['estudiante'],
    };

    const allowed = allowedTargetsMap[callerRole.toLowerCase()] || [];
    const invalidRole = requestedRoles.find((r) => !allowed.includes(r.toLowerCase()));
    if (invalidRole) {
      return res.status(403).json({
        message: `El rol '${callerRole}' no está autorizado para crear cuentas con rol '${invalidRole}'.`,
      });
    }
  }

  const { hash, salt } = hashPassword(password);
  const newUser: User = {
    id: mockStore.getNextUserId(),
    username: normalizedUsername,
    passwordHash: hash,
    passwordSalt: salt,
  };

  const newPersona: Persona = {
    id: mockStore.getNextPersonaId(),
    nombre: nombre || '',
    apellido: apellido || '',
    correo: correo || '',
    rol: requestedRoles[0] || 'Estudiante',
    roles: requestedRoles,
    userId: newUser.id,
  };

  newUser.persona = newPersona;
  mockStore.users.push(newUser);
  mockStore.personas.push(newPersona);

  const token = createToken(newUser);

  return res.json({
    id: newUser.id,
    username: newUser.username,
    token,
    roles: newPersona.roles,
    rol: newPersona.rol,
    nombre: newPersona.nombre,
    apellido: newPersona.apellido,
    correo: newPersona.correo,
  });
});

// POST /api/Login/login and /api/login/login
loginRouter.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(401).json({ message: 'Username y password requeridos.' });
  }

  const normalized = username.trim().toLowerCase();
  const user = mockStore.users.find((u) => u.username.toLowerCase() === normalized);

  if (!user) {
    return res.status(401).json({ message: 'Invalid username' });
  }

  const valid = verifyPassword(password, user.passwordHash, user.passwordSalt);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid password' });
  }

  const token = createToken(user);

  return res.json({
    id: user.id,
    username: user.username,
    token,
    roles: user.persona?.roles || [],
    rol: user.persona?.rol || '',
    nombre: user.persona?.nombre || '',
    apellido: user.persona?.apellido || '',
    correo: user.persona?.correo || '',
  });
});
