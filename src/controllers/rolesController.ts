import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { mockStore } from '../data/mockStore.js';

export const rolesRouter = Router();

rolesRouter.use(requireAuth);

// PUT /api/roles/:userId
rolesRouter.put('/:userId', (req, res) => {
  const targetUserId = parseInt(req.params.userId, 10);
  if (isNaN(targetUserId)) {
    return res.status(400).json({ message: 'ID de usuario inválido.' });
  }

  const { roles, rol } = req.body || {};
  let requestedRoles: string[] = [];
  if (Array.isArray(roles) && roles.length > 0) {
    requestedRoles = roles;
  } else if (rol) {
    requestedRoles = [rol];
  }

  requestedRoles = Array.from(new Set(requestedRoles.map((r) => String(r).trim()))).filter(Boolean);

  if (requestedRoles.length === 0) {
    return res.status(400).json({ message: 'Rol requerido.' });
  }

  const callerRoles = req.user!.roles;
  const callerRole = callerRoles[0] || '';

  const wantsAdmin = requestedRoles.some((r) => r.toLowerCase() === 'administrador');
  const callerIsAdmin = callerRoles.some((r) => r.toLowerCase() === 'administrador');

  if (wantsAdmin && !callerIsAdmin) {
    return res.status(403).json({ message: 'Solo Administrador puede asignar el rol Administrador.' });
  }

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
      message: `El rol '${callerRole}' no está autorizado para asignar el rol '${invalidRole}'.`,
    });
  }

  const targetUser = mockStore.users.find((u) => u.id === targetUserId);
  if (!targetUser) {
    return res.status(404).json({ message: 'Usuario no encontrado.' });
  }

  const targetPersona = mockStore.personas.find((p) => p.userId === targetUserId);
  if (!targetPersona) {
    return res.status(400).json({ message: 'El usuario no tiene una entidad Persona asociada; no se puede asignar rol.' });
  }

  targetPersona.roles = requestedRoles;
  targetPersona.rol = requestedRoles[0] || 'Estudiante';

  return res.json({
    message: `Roles del usuario ${targetUserId} actualizados: ${requestedRoles.join(', ')}.`,
  });
});
