import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { mockStore } from '../data/mockStore.js';

export const coordinadorRouter = Router();

coordinadorRouter.use(requireAuth);

// GET /api/Coordinador/ayudantias/solicitudes
coordinadorRouter.get('/ayudantias/solicitudes', (req, res) => {
  const pendientes = mockStore.ayudantias.filter((a) => a.estado === 'Pendiente');

  const result = pendientes.map((a) => {
    const estudiante = mockStore.users.find((u) => u.id === a.estudianteId);
    const catedra = mockStore.catedras.find((c) => c.id === a.catedraId);

    return {
      ayudantiaId: a.id,
      estudianteId: a.estudianteId,
      nombreEstudiante: estudiante?.username || '',
      catedraId: a.catedraId,
      nombreCatedra: catedra?.nombre || '',
      estado: a.estado,
    };
  });

  return res.json(result);
});

// POST /api/Coordinador/ayudantias/asignar
coordinadorRouter.post('/ayudantias/asignar', (req, res) => {
  const { ayudantiaId } = req.body || {};

  const ayudantia = mockStore.ayudantias.find((a) => a.id === ayudantiaId);
  if (!ayudantia) {
    return res.status(404).json({ message: 'Solicitud de ayudantía no encontrada.' });
  }

  const catedra = mockStore.catedras.find((c) => c.id === ayudantia.catedraId);
  const inscripcion = mockStore.inscripciones.find(
    (i) => i.estudianteId === ayudantia.estudianteId && i.catedraId === ayudantia.catedraId
  );

  if (catedra?.minimoNota != null) {
    if (!inscripcion) {
      return res.status(400).json({ message: 'No se puede asignar: el estudiante no está inscrito en la cátedra.' });
    }
    if (inscripcion.promedioActual < catedra.minimoNota) {
      return res.status(400).json({
        message: 'No se puede asignar: el promedio del estudiante es inferior a la nota mínima establecida.',
      });
    }
  }

  ayudantia.estado = 'Activa';
  return res.json({ message: 'Ayudante asignado exitosamente.' });
});

// PUT /api/Coordinador/catedras/:catedraId/minimo-nota
coordinadorRouter.put('/catedras/:catedraId/minimo-nota', (req, res) => {
  const catedraId = parseInt(req.params.catedraId, 10);
  const { minimoNota } = req.body || {};

  const catedra = mockStore.catedras.find((c) => c.id === catedraId);
  if (!catedra) {
    return res.status(404).json({ message: 'Cátedra no encontrada.' });
  }

  catedra.minimoNota = Number(minimoNota);
  return res.json({ message: `Nota mínima para la cátedra ${catedraId} actualizada a ${minimoNota}.` });
});

// GET /api/Coordinador/ayudantias/seguimiento
coordinadorRouter.get('/ayudantias/seguimiento', (req, res) => {
  const activas = mockStore.ayudantias.filter((a) => a.estado === 'Activa');

  const result = activas.map((a) => {
    const estudiante = mockStore.users.find((u) => u.id === a.estudianteId);
    const catedra = mockStore.catedras.find((c) => c.id === a.catedraId);

    return {
      ayudantiaId: a.id,
      estudianteId: a.estudianteId,
      nombreEstudiante: estudiante?.username || '',
      catedraId: a.catedraId,
      nombreCatedra: catedra?.nombre || '',
      estado: a.estado,
    };
  });

  return res.json(result);
});

// PUT /api/Coordinador/ayudantias/:ayudantiaId/estado
coordinadorRouter.put('/ayudantias/:ayudantiaId/estado', (req, res) => {
  const ayudantiaId = parseInt(req.params.ayudantiaId, 10);
  const { nuevoEstado } = req.body || {};

  const ayudantia = mockStore.ayudantias.find((a) => a.id === ayudantiaId);
  if (!ayudantia) {
    return res.status(404).json({ message: 'Ayudantía no encontrada.' });
  }

  ayudantia.estado = nuevoEstado || ayudantia.estado;
  return res.json({ message: `Estado de la ayudantía actualizado a ${nuevoEstado}.` });
});

// GET /api/Coordinador/ayudantias/reportes-administrativos
coordinadorRouter.get('/ayudantias/reportes-administrativos', (req, res) => {
  const counts: Record<string, number> = {};
  for (const a of mockStore.ayudantias) {
    counts[a.estado] = (counts[a.estado] || 0) + 1;
  }

  const reporte = Object.entries(counts).map(([estado, cantidad]) => ({
    estado,
    cantidad,
  }));

  return res.json(reporte);
});
