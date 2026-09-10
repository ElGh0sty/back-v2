import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { mockStore } from '../data/mockStore.js';
import type { ClaseSesion, Asistencia } from '../types/index.js';

export const claseSesionRouter = Router();

claseSesionRouter.use(requireAuth);

function isDocenteOfClaseSesionContext(materiaId: number, claseId: number | undefined, userId: number): boolean {
  const isDocenteMateria = mockStore.catedras.some((m) => m.id === materiaId && m.docenteId === userId);
  if (isDocenteMateria) return true;

  if (claseId) {
    const isDocenteClase = mockStore.clases.some((c) => c.id === claseId && c.docenteId === userId);
    if (isDocenteClase) return true;
  }

  return false;
}

// POST /api/ClaseSesion
claseSesionRouter.post('/', (req, res) => {
  const userId = req.user!.id;
  const dto = req.body || {};

  if (!isDocenteOfClaseSesionContext(dto.materiaId, dto.claseId, userId)) {
    return res.status(403).json({ message: 'Solo el docente responsable de la materia o clase puede crear sesiones.' });
  }

  const sesion: ClaseSesion = {
    id: mockStore.getNextClaseSesionId(),
    materiaId: dto.materiaId,
    claseId: dto.claseId,
    docenteId: userId,
    fecha: dto.fecha || new Date().toISOString().split('T')[0],
    horaInicio: dto.horaInicio || '08:00',
    horaFin: dto.horaFin || '10:00',
    tipoClase: dto.tipoClase || 'Presencial',
    linkVirtual: dto.linkVirtual,
    aplicacionVirtual: dto.aplicacionVirtual,
    edificioPresencial: dto.edificioPresencial,
    aulaPresencial: dto.aulaPresencial,
    pisoPresencial: dto.pisoPresencial,
  };

  mockStore.clasesSesiones.push(sesion);
  return res.status(201).json(sesion);
});

// GET /api/ClaseSesion/:id
claseSesionRouter.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const userId = req.user!.id;

  const sesion = mockStore.clasesSesiones.find((cs) => cs.id === id);
  if (!sesion) {
    return res.status(404).json({ message: 'Sesión no encontrada.' });
  }

  const isDocente = sesion.docenteId === userId;
  const isStudentInMateria = mockStore.inscripciones.some(
    (i) => i.estudianteId === userId && i.catedraId === sesion.materiaId
  );
  const isStudentInClase =
    !!sesion.claseId &&
    mockStore.clases.some((c) => c.id === sesion.claseId && c.estudianteIds.includes(userId));

  if (!isDocente && !isStudentInMateria && !isStudentInClase) {
    return res.status(403).json({ message: 'No tienes permiso para ver esta sesión de clase.' });
  }

  return res.json(sesion);
});

// GET /api/ClaseSesion/materia/:materiaId
claseSesionRouter.get('/materia/:materiaId', (req, res) => {
  const materiaId = parseInt(req.params.materiaId, 10);
  const userId = req.user!.id;

  const sesiones = mockStore.clasesSesiones.filter((cs) => cs.materiaId === materiaId);
  if (sesiones.length === 0) {
    return res.status(404).json({ message: 'No se encontraron sesiones de clase.' });
  }

  const authorized = sesiones.filter((s) => {
    const isDocente = s.docenteId === userId;
    const isStudentInMateria = mockStore.inscripciones.some(
      (i) => i.estudianteId === userId && i.catedraId === s.materiaId
    );
    const isStudentInClase =
      !!s.claseId &&
      mockStore.clases.some((c) => c.id === s.claseId && c.estudianteIds.includes(userId));
    return isDocente || isStudentInMateria || isStudentInClase;
  });

  if (authorized.length === 0) {
    return res.status(403).json({ message: 'No tienes permiso para ver estas sesiones de clase.' });
  }

  return res.json(authorized);
});

// GET /api/ClaseSesion/clase/:claseId
claseSesionRouter.get('/clase/:claseId', (req, res) => {
  const claseId = parseInt(req.params.claseId, 10);
  const userId = req.user!.id;

  const sesiones = mockStore.clasesSesiones.filter((cs) => cs.claseId === claseId);
  if (sesiones.length === 0) {
    return res.status(404).json({ message: 'No se encontraron sesiones de clase.' });
  }

  const authorized = sesiones.filter((s) => {
    const isDocente = s.docenteId === userId;
    const isStudentInClase = mockStore.clases.some((c) => c.id === claseId && c.estudianteIds.includes(userId));
    return isDocente || isStudentInClase;
  });

  if (authorized.length === 0) {
    return res.status(403).json({ message: 'No tienes permiso para ver estas sesiones de clase.' });
  }

  return res.json(authorized);
});

// POST /api/ClaseSesion/:claseSesionId/asistencia
claseSesionRouter.post('/:claseSesionId/asistencia', (req, res) => {
  const claseSesionId = parseInt(req.params.claseSesionId, 10);
  const userId = req.user!.id;

  const sesion = mockStore.clasesSesiones.find((cs) => cs.id === claseSesionId);
  if (!sesion) {
    return res.status(404).json({ message: 'Sesión de clase no encontrada.' });
  }

  if (sesion.docenteId !== userId) {
    return res.status(403).json({ message: 'Solo el docente de esta sesión puede registrar asistencia.' });
  }

  const { estudianteId, presente } = req.body || {};
  const student = mockStore.users.find(
    (u) => u.id === estudianteId && u.persona?.roles.some((r) => r.toLowerCase() === 'estudiante')
  );
  if (!student) {
    return res.status(400).json({ message: 'El ID de estudiante proporcionado no es válido.' });
  }

  const existing = mockStore.asistencias.find(
    (a) => a.claseSesionId === claseSesionId && a.estudianteId === estudianteId
  );
  if (existing) {
    return res.status(409).json({ message: 'La asistencia para este estudiante en esta sesión ya ha sido registrada.' });
  }

  const asistencia: Asistencia = {
    id: mockStore.getNextAsistenciaId(),
    claseSesionId,
    estudianteId,
    presente: Boolean(presente),
  };

  mockStore.asistencias.push(asistencia);
  return res.status(201).json(asistencia);
});

// GET /api/ClaseSesion/:claseSesionId/asistencia
claseSesionRouter.get('/:claseSesionId/asistencia', (req, res) => {
  const claseSesionId = parseInt(req.params.claseSesionId, 10);
  const userId = req.user!.id;

  const sesion = mockStore.clasesSesiones.find((cs) => cs.id === claseSesionId);
  if (!sesion) {
    return res.status(404).json({ message: 'Sesión de clase no encontrada.' });
  }

  if (sesion.docenteId !== userId) {
    return res.status(403).json({ message: 'Solo el docente de esta sesión puede ver la asistencia.' });
  }

  const asistencias = mockStore.asistencias.filter((a) => a.claseSesionId === claseSesionId);
  if (asistencias.length === 0) {
    return res.status(404).json({ message: 'No se ha registrado asistencia para esta sesión.' });
  }

  return res.json(asistencias);
});

// GET /api/ClaseSesion/estudiante/asistencia/:claseSesionId
claseSesionRouter.get('/estudiante/asistencia/:claseSesionId', (req, res) => {
  const claseSesionId = parseInt(req.params.claseSesionId, 10);
  const userId = req.user!.id;

  const asistencia = mockStore.asistencias.find(
    (a) => a.claseSesionId === claseSesionId && a.estudianteId === userId
  );

  if (!asistencia) {
    return res.status(404).json({ message: 'No se encontró registro de asistencia para esta sesión.' });
  }

  return res.json(asistencia);
});
