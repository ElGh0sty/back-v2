import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { mockStore } from '../data/mockStore.js';

export const personaRouter = Router();

personaRouter.use(requireAuth);

// GET /api/Persona and /api/persona
personaRouter.get('/', (req, res) => {
  const userId = req.user!.id;
  const persona = mockStore.personas.find((p) => p.userId === userId);
  if (!persona) {
    return res.status(404).json({ message: 'Datos personales no encontrados.' });
  }

  return res.json({
    nombre: persona.nombre,
    apellido: persona.apellido,
    correo: persona.correo,
  });
});

// PUT /api/Persona and /api/persona
personaRouter.put('/', (req, res) => {
  const userId = req.user!.id;
  const persona = mockStore.personas.find((p) => p.userId === userId);
  if (!persona) {
    return res.status(404).json({ message: 'Datos personales no encontrados.' });
  }

  const { nombre, apellido, correo } = req.body || {};
  if (nombre !== undefined) persona.nombre = nombre;
  if (apellido !== undefined) persona.apellido = apellido;
  if (correo !== undefined) persona.correo = correo;

  return res.json({ message: 'Datos personales actualizados correctamente.' });
});
