import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { mockStore } from '../data/mockStore.js';
import type { Recurso, Actividad, RecursoVistoPorEstudiante } from '../types/index.js';

export const materiaRouter = Router();

materiaRouter.use(requireAuth);

function isDocenteOfMateria(materiaId: number, userId: number): boolean {
  const catedra = mockStore.catedras.find((c) => c.id === materiaId);
  return !!catedra && catedra.docenteId === userId;
}

// POST /api/Materia/:materiaId/recursos
materiaRouter.post('/:materiaId/recursos', (req, res) => {
  const materiaId = parseInt(req.params.materiaId, 10);
  const userId = req.user!.id;

  if (!isDocenteOfMateria(materiaId, userId)) {
    return res.status(403).json({ message: 'Solo el docente responsable puede añadir recursos a esta materia.' });
  }

  const materia = mockStore.catedras.find((c) => c.id === materiaId);
  if (!materia) {
    return res.status(404).json({ message: 'Materia no encontrada.' });
  }

  const { titulo, descripcion, url, esEsencial } = req.body || {};
  const recurso: Recurso = {
    id: mockStore.getNextRecursoId(),
    titulo: titulo || '',
    descripcion: descripcion || '',
    url: url || '',
    esEsencial: Boolean(esEsencial),
    materiaId,
  };

  mockStore.recursos.push(recurso);
  return res.status(201).json(recurso);
});

// GET /api/Materia/:materiaId/recursos
materiaRouter.get('/:materiaId/recursos', (req, res) => {
  const materiaId = parseInt(req.params.materiaId, 10);
  const recursos = mockStore.recursos.filter((r) => r.materiaId === materiaId);

  if (recursos.length === 0) {
    return res.status(404).json({ message: 'No se encontraron recursos para esta materia.' });
  }

  return res.json(recursos);
});

// POST /api/Materia/:materiaId/actividades
materiaRouter.post('/:materiaId/actividades', (req, res) => {
  const materiaId = parseInt(req.params.materiaId, 10);
  const userId = req.user!.id;

  if (!isDocenteOfMateria(materiaId, userId)) {
    return res.status(403).json({ message: 'Solo el docente responsable puede añadir actividades a esta materia.' });
  }

  const materia = mockStore.catedras.find((c) => c.id === materiaId);
  if (!materia) {
    return res.status(404).json({ message: 'Materia no encontrada.' });
  }

  const { titulo, descripcion, fechaEntrega, tipo } = req.body || {};
  const actividad: Actividad = {
    id: mockStore.getNextActividadId(),
    titulo: titulo || '',
    descripcion: descripcion || '',
    fechaEntrega: fechaEntrega || new Date().toISOString(),
    tipo: tipo || 'Tarea',
    estado: 'Pendiente',
    materiaId,
  };

  mockStore.actividades.push(actividad);
  return res.status(201).json(actividad);
});

// GET /api/Materia/:materiaId/actividades
materiaRouter.get('/:materiaId/actividades', (req, res) => {
  const materiaId = parseInt(req.params.materiaId, 10);
  const actividades = mockStore.actividades.filter((a) => a.materiaId === materiaId);

  if (actividades.length === 0) {
    return res.status(404).json({ message: 'No se encontraron actividades para esta materia.' });
  }

  return res.json(actividades);
});

// POST /api/Materia/recursos/marcar-visto
materiaRouter.post('/recursos/marcar-visto', (req, res) => {
  const userId = req.user!.id;
  const { recursoId } = req.body || {};

  const recurso = mockStore.recursos.find((r) => r.id === recursoId);
  if (!recurso) {
    return res.status(404).json({ message: 'Recurso no encontrado.' });
  }

  const isStudentInMateria = mockStore.inscripciones.some(
    (i) => i.estudianteId === userId && i.catedraId === recurso.materiaId
  );
  if (!isStudentInMateria) {
    return res.status(403).json({
      message: 'No tienes permiso para marcar este recurso como visto, ya que no estás inscrito en la materia.',
    });
  }

  const existing = mockStore.recursosVistos.find(
    (rv) => rv.recursoId === recursoId && rv.estudianteId === userId
  );
  if (existing) {
    return res.status(409).json({ message: 'Este recurso ya ha sido marcado como visto por este estudiante.' });
  }

  const vistoEntry: RecursoVistoPorEstudiante = {
    id: mockStore.getNextRecursoVistoId(),
    recursoId,
    estudianteId: userId,
    fechaVisto: new Date().toISOString(),
  };

  mockStore.recursosVistos.push(vistoEntry);
  return res.json({ message: 'Recurso marcado como visto exitosamente.' });
});

// GET /api/Materia/:materiaId/recursos/estado
materiaRouter.get('/:materiaId/recursos/estado', (req, res) => {
  const materiaId = parseInt(req.params.materiaId, 10);
  const userId = req.user!.id;

  const isStudentInMateria = mockStore.inscripciones.some(
    (i) => i.estudianteId === userId && i.catedraId === materiaId
  );
  if (!isStudentInMateria) {
    return res.status(403).json({ message: 'No tienes permiso para ver el estado de los recursos de esta materia.' });
  }

  const recursos = mockStore.recursos.filter((r) => r.materiaId === materiaId);
  if (recursos.length === 0) {
    return res.status(404).json({ message: 'No se encontraron recursos para esta materia.' });
  }

  const result = recursos.map((r) => {
    const visto = mockStore.recursosVistos.some(
      (rv) => rv.recursoId === r.id && rv.estudianteId === userId
    );
    return {
      ...r,
      visto,
    };
  });

  return res.json(result);
});
