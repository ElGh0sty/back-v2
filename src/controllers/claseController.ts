import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { mockStore } from '../data/mockStore.js';
import type { Clase } from '../types/index.js';

export const claseRouter = Router();

claseRouter.use(requireAuth);

function isDocenteOfClase(claseId: number, userId: number): boolean {
  const clase = mockStore.clases.find((c) => c.id === claseId);
  return !!clase && clase.docenteId === userId;
}

// POST /api/Clase
claseRouter.post('/', (req, res) => {
  const userId = req.user!.id;
  const { nombre, materiaId, docenteId, estudianteIds } = req.body || {};

  if (docenteId !== userId) {
    return res.status(403).json({ message: 'Solo puedes crear clases para ti mismo como docente.' });
  }

  const materia = mockStore.catedras.find((c) => c.id === materiaId);
  if (!materia) {
    return res.status(404).json({ message: 'Materia no encontrada.' });
  }

  if (materia.docenteId !== userId) {
    return res.status(403).json({ message: 'El docente asignado no es responsable de esta materia.' });
  }

  const validStudentIds: number[] = [];
  if (Array.isArray(estudianteIds) && estudianteIds.length > 0) {
    for (const sId of estudianteIds) {
      const student = mockStore.users.find(
        (u) => u.id === sId && u.persona?.roles.some((r) => r.toLowerCase() === 'estudiante')
      );
      if (!student) {
        return res.status(400).json({
          message: 'Algunos IDs de estudiantes proporcionados no son válidos o no corresponden a estudiantes.',
        });
      }
      validStudentIds.push(sId);
    }
  }

  const clase: Clase = {
    id: mockStore.getNextClaseId(),
    nombre: nombre || 'Nueva Clase',
    materiaId,
    docenteId,
    estudianteIds: validStudentIds,
  };

  mockStore.clases.push(clase);

  return res.status(201).json({
    id: clase.id,
    nombre: clase.nombre,
    materiaId: clase.materiaId,
    docenteId: clase.docenteId,
    estudianteIds: clase.estudianteIds,
  });
});

// GET /api/Clase/:id
claseRouter.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const userId = req.user!.id;

  const clase = mockStore.clases.find((c) => c.id === id);
  if (!clase) {
    return res.status(404).json({ message: 'Clase no encontrada.' });
  }

  const isDocente = clase.docenteId === userId;
  const isStudent = clase.estudianteIds.includes(userId);

  if (!isDocente && !isStudent) {
    return res.status(403).json({ message: 'No tienes permiso para ver esta clase.' });
  }

  return res.json({
    id: clase.id,
    nombre: clase.nombre,
    materiaId: clase.materiaId,
    docenteId: clase.docenteId,
    estudianteIds: clase.estudianteIds,
  });
});

// POST /api/Clase/:claseId/estudiantes
claseRouter.post('/:claseId/estudiantes', (req, res) => {
  const claseId = parseInt(req.params.claseId, 10);
  const userId = req.user!.id;

  if (!isDocenteOfClase(claseId, userId)) {
    return res.status(403).json({ message: 'Solo el docente de esta clase puede añadir estudiantes.' });
  }

  const clase = mockStore.clases.find((c) => c.id === claseId);
  if (!clase) {
    return res.status(404).json({ message: 'Clase no encontrada.' });
  }

  const estudianteIds = req.body;
  if (!Array.isArray(estudianteIds)) {
    return res.status(400).json({ message: 'Se esperaba un arreglo de IDs de estudiantes.' });
  }

  for (const sId of estudianteIds) {
    const student = mockStore.users.find(
      (u) => u.id === sId && u.persona?.roles.some((r) => r.toLowerCase() === 'estudiante')
    );
    if (!student) {
      return res.status(400).json({
        message: 'Algunos IDs de estudiantes proporcionados no son válidos o no corresponden a estudiantes.',
      });
    }
    if (!clase.estudianteIds.includes(sId)) {
      clase.estudianteIds.push(sId);
    }
  }

  return res.json({ message: 'Estudiantes añadidos exitosamente a la clase.' });
});

// GET /api/Clase/:claseId/estudiantes
claseRouter.get('/:claseId/estudiantes', (req, res) => {
  const claseId = parseInt(req.params.claseId, 10);
  const userId = req.user!.id;

  const clase = mockStore.clases.find((c) => c.id === claseId);
  if (!clase) {
    return res.status(404).json({ message: 'Clase no encontrada.' });
  }

  const isDocente = clase.docenteId === userId;
  const isStudent = clase.estudianteIds.includes(userId);

  if (!isDocente && !isStudent) {
    return res.status(403).json({ message: 'No tienes permiso para ver los estudiantes de esta clase.' });
  }

  const estudiantesDto = clase.estudianteIds.map((sId) => {
    const user = mockStore.users.find((u) => u.id === sId);
    return {
      id: sId,
      username: user?.username || '',
      nombre: user?.persona?.nombre || '',
      apellido: user?.persona?.apellido || '',
      correo: user?.persona?.correo || '',
    };
  });

  return res.json(estudiantesDto);
});
