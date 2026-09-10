import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { mockStore } from '../data/mockStore.js';
import type { Evaluacion, ActividadAyudantia } from '../types/index.js';

export const docenteRouter = Router();

docenteRouter.use(requireAuth);

// POST /api/Docente/catedras/:catedraId/evaluacion-diagnostica
docenteRouter.post('/catedras/:catedraId/evaluacion-diagnostica', (req, res) => {
  const catedraId = parseInt(req.params.catedraId, 10);
  const { nombre } = req.body || {};

  const evaluacion: Evaluacion = {
    id: mockStore.getNextEvaluacionId(),
    catedraId,
    nombre: nombre || 'Evaluación Diagnóstica',
    esDiagnostica: true,
    adaptadaConIA: false,
  };

  mockStore.evaluaciones.push(evaluacion);
  return res.status(201).json(evaluacion);
});

// PUT /api/Docente/catedras/:catedraId/cronograma
docenteRouter.put('/catedras/:catedraId/cronograma', (req, res) => {
  const catedraId = parseInt(req.params.catedraId, 10);
  const { id, descripcion, fechaPrevista, fechaReal } = req.body || {};

  let cronograma = mockStore.cronogramas.find((c) => c.id === id && c.catedraId === catedraId);
  if (!cronograma) {
    cronograma = {
      id: id || mockStore.getNextCronogramaId(),
      catedraId,
      descripcion: descripcion || '',
      fechaPrevista: fechaPrevista || new Date().toISOString(),
      fechaReal,
    };
    mockStore.cronogramas.push(cronograma);
  } else {
    cronograma.descripcion = descripcion ?? cronograma.descripcion;
    cronograma.fechaPrevista = fechaPrevista ?? cronograma.fechaPrevista;
    cronograma.fechaReal = fechaReal ?? cronograma.fechaReal;
  }

  return res.json(cronograma);
});

// POST /api/Docente/ayudantias/:ayudantiaId/planificacion
docenteRouter.post('/ayudantias/:ayudantiaId/planificacion', (req, res) => {
  const ayudantiaId = parseInt(req.params.ayudantiaId, 10);
  const { descripcion, fechaPlanificada } = req.body || {};

  const actividad: ActividadAyudantia = {
    id: mockStore.getNextActividadAyudantiaId(),
    ayudantiaId,
    descripcion: descripcion || '',
    fechaPlanificada: fechaPlanificada || new Date().toISOString(),
    completada: false,
  };

  mockStore.actividadesAyudantia.push(actividad);
  return res.status(201).json(actividad);
});

// GET /api/Docente/ayudantias/:ayudantiaId/monitoreo
docenteRouter.get('/ayudantias/:ayudantiaId/monitoreo', (req, res) => {
  const ayudantiaId = parseInt(req.params.ayudantiaId, 10);

  const ayudantia = mockStore.ayudantias.find((a) => a.id === ayudantiaId);
  if (!ayudantia) {
    return res.status(404).json({ message: 'Ayudantía no encontrada.' });
  }

  const estudiante = mockStore.users.find((u) => u.id === ayudantia.estudianteId);
  const planificacion = mockStore.actividadesAyudantia.filter((a) => a.ayudantiaId === ayudantiaId);
  const bitacoras = mockStore.bitacoras.filter((b) => b.ayudantiaId === ayudantiaId);

  return res.json({
    ayudantiaId: ayudantia.id,
    nombreAyudante: estudiante?.username || '',
    planificacion,
    bitacoras: bitacoras.map((b) => ({
      id: b.id,
      fecha: b.fecha,
      actividadesRealizadas: b.actividadesRealizadas,
      evidenciaUrl: b.evidenciaUrl,
    })),
  });
});

// GET /api/Docente/actividades/:actividadId/entregas
docenteRouter.get('/actividades/:actividadId/entregas', (req, res) => {
  const actividadId = parseInt(req.params.actividadId, 10);

  const actividad = mockStore.actividades.find((a) => a.id === actividadId);
  if (!actividad) {
    return res.status(404).json({ message: 'Actividad no encontrada.' });
  }

  const entregas = mockStore.actividadesRealizadas
    .filter((e) => e.actividadId === actividadId)
    .map((e) => {
      const student = mockStore.users.find((u) => u.id === e.estudianteId);
      const studentName = student?.persona
        ? `${student.persona.nombre} ${student.persona.apellido}`
        : 'Estudiante';
      return {
        id: e.id,
        estudianteId: e.estudianteId,
        nombreEstudiante: studentName,
        archivoUrl: e.archivoUrl,
        fechaRealizada: e.fechaRealizada,
        completada: e.completada,
        calificacion: e.calificacion,
        retroalimentacion: e.retroalimentacion,
      };
    });

  return res.json(entregas);
});

// POST /api/Docente/actividades/calificar
docenteRouter.post('/actividades/calificar', (req, res) => {
  const { entregaId, calificacion, retroalimentacion } = req.body || {};

  const entrega = mockStore.actividadesRealizadas.find((e) => e.id === entregaId);
  if (!entrega) {
    return res.status(404).json({ message: 'Entrega no encontrada.' });
  }

  entrega.calificacion = Number(calificacion);
  entrega.retroalimentacion = retroalimentacion || '';
  entrega.completada = true;

  return res.json({
    message: 'Calificación registrada correctamente.',
    entregaId: entrega.id,
    calificacion: entrega.calificacion,
  });
});
