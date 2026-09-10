import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { mockStore } from '../data/mockStore.js';
import type { Presentacion, PresentacionEvaluacion } from '../types/index.js';

export const juradoRouter = Router();

juradoRouter.use(requireAuth);

// POST /api/Jurado/presentaciones
juradoRouter.post('/presentaciones', (req, res) => {
  const { ayudantiaId, fecha, juradoIds, decanoId, coordinadorCarreraId } = req.body || {};

  const presentacion: Presentacion = {
    id: mockStore.getNextPresentacionId(),
    ayudantiaId,
    fecha: fecha || new Date().toISOString(),
    juradoIds: Array.isArray(juradoIds) ? juradoIds : [],
    decanoId,
    coordinadorCarreraId,
  };

  mockStore.presentaciones.push(presentacion);
  return res.status(201).json(presentacion);
});

// GET /api/Jurado/presentaciones
juradoRouter.get('/presentaciones', (req, res) => {
  const userId = req.user!.id;
  const isJurado = req.user!.roles.some((r) => r.toLowerCase() === 'jurado');
  const isAdminOrCoord = req.user!.roles.some((r) =>
    ['administrador', 'coordinador', 'decano'].includes(r.toLowerCase())
  );

  let presentaciones = mockStore.presentaciones;
  if (!isAdminOrCoord && isJurado) {
    presentaciones = presentaciones.filter((p) => p.juradoIds.includes(userId));
  }

  const result = presentaciones.map((p) => {
    const ayudantia = mockStore.ayudantias.find((a) => a.id === p.ayudantiaId);
    const estudiante = mockStore.users.find((u) => u.id === ayudantia?.estudianteId);
    const catedra = mockStore.catedras.find((c) => c.id === ayudantia?.catedraId);

    return {
      id: p.id,
      ayudantiaId: p.ayudantiaId,
      fecha: p.fecha,
      juradoIds: p.juradoIds,
      nombreEstudiante: estudiante?.persona
        ? `${estudiante.persona.nombre} ${estudiante.persona.apellido}`
        : estudiante?.username || '',
      nombreCatedra: catedra?.nombre || '',
    };
  });

  return res.json(result);
});

// POST /api/Jurado/presentaciones/:presentacionId/evaluaciones
juradoRouter.post('/presentaciones/:presentacionId/evaluaciones', (req, res) => {
  const presentacionId = parseInt(req.params.presentacionId, 10);
  const juradoId = req.user!.id;
  const { nota, observaciones } = req.body || {};

  const presentacion = mockStore.presentaciones.find((p) => p.id === presentacionId);
  if (!presentacion) {
    return res.status(404).json({ message: 'Presentación no encontrada.' });
  }

  if (!presentacion.juradoIds.includes(juradoId)) {
    return res.status(403).json({ message: 'No estás asignado como jurado para esta presentación.' });
  }

  let evaluacion = mockStore.presentacionEvaluaciones.find(
    (e) => e.presentacionId === presentacionId && e.juradoId === juradoId
  );

  if (!evaluacion) {
    evaluacion = {
      id: mockStore.getNextPresentacionEvalId(),
      presentacionId,
      juradoId,
      nota: Number(nota),
      observaciones: observaciones || '',
      fecha: new Date().toISOString(),
    };
    mockStore.presentacionEvaluaciones.push(evaluacion);
  } else {
    evaluacion.nota = Number(nota);
    evaluacion.observaciones = observaciones || '';
    evaluacion.fecha = new Date().toISOString();
  }

  return res.json({ message: 'Evaluación registrada exitosamente.', evaluacion });
});

// GET /api/Jurado/presentaciones/:presentacionId/resultado
juradoRouter.get('/presentaciones/:presentacionId/resultado', (req, res) => {
  const presentacionId = parseInt(req.params.presentacionId, 10);

  const presentacion = mockStore.presentaciones.find((p) => p.id === presentacionId);
  if (!presentacion) {
    return res.status(404).json({ message: 'Presentación no encontrada.' });
  }

  const evaluaciones = mockStore.presentacionEvaluaciones.filter((e) => e.presentacionId === presentacionId);
  if (evaluaciones.length === 0) {
    return res.status(404).json({ message: 'Aún no se han registrado evaluaciones para esta presentación.' });
  }

  const promedio = evaluaciones.reduce((acc, curr) => acc + curr.nota, 0) / evaluaciones.length;

  return res.json({
    presentacionId,
    promedio: Math.round(promedio * 100) / 100,
    aprobado: promedio >= 70.0,
    evaluaciones: evaluaciones.map((e) => {
      const jurado = mockStore.users.find((u) => u.id === e.juradoId);
      return {
        juradoId: e.juradoId,
        nombreJurado: jurado?.persona
          ? `${jurado.persona.nombre} ${jurado.persona.apellido}`
          : jurado?.username || '',
        nota: e.nota,
        observaciones: e.observaciones,
      };
    }),
  });
});
