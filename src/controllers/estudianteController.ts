import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/authMiddleware.js';
import { mockStore } from '../data/mockStore.js';
import type { Ayudantia, Bitacora, EstudianteActividadRealizada } from '../types/index.js';

const upload = multer({ dest: 'uploads/' });

export const estudianteRouter = Router();

estudianteRouter.use(requireAuth);

function checkAyudantiaOwnership(ayudantiaId: number, studentId: number): boolean {
  const ayudantia = mockStore.ayudantias.find((a) => a.id === ayudantiaId && a.estudianteId === studentId);
  return !!ayudantia;
}

// POST /api/Estudiante/ayudantias/postulaciones
estudianteRouter.post('/ayudantias/postulaciones', (req, res) => {
  const estudianteId = req.user!.id;
  const { catedraId } = req.body || {};

  const existe = mockStore.ayudantias.some((a) => a.estudianteId === estudianteId && a.catedraId === catedraId);
  if (existe) {
    return res.status(409).json({ message: 'Ya te has postulado a esta ayudantía.' });
  }

  const inscripcion = mockStore.inscripciones.find(
    (i) => i.estudianteId === estudianteId && i.catedraId === catedraId
  );
  if (!inscripcion) {
    return res.status(403).json({ message: 'Debes estar inscrito en la cátedra para postular a ayudantía.' });
  }

  const catedra = mockStore.catedras.find((c) => c.id === catedraId);
  if (catedra?.minimoNota != null && inscripcion.promedioActual < catedra.minimoNota) {
    return res.status(403).json({
      message: 'Tu promedio actual es menor que la nota mínima para postular a esta ayudantía.',
    });
  }

  const ayudantia: Ayudantia = {
    id: mockStore.getNextAyudantiaId(),
    catedraId,
    estudianteId,
    estado: 'Pendiente',
  };

  mockStore.ayudantias.push(ayudantia);
  return res.json({ message: 'Postulación enviada exitosamente.', id: ayudantia.id });
});

// POST /api/Estudiante/ayudantias/bitacora
estudianteRouter.post('/ayudantias/bitacora', (req, res) => {
  const estudianteId = req.user!.id;
  const { ayudantiaId, actividadesRealizadas, evidenciaUrl } = req.body || {};

  if (!checkAyudantiaOwnership(ayudantiaId, estudianteId)) {
    return res.status(403).json({ message: 'No tienes permiso para realizar acciones sobre esta ayudantía.' });
  }

  const bitacora: Bitacora = {
    id: mockStore.getNextBitacoraId(),
    ayudantiaId,
    fecha: new Date().toISOString(),
    actividadesRealizadas: actividadesRealizadas || '',
    evidenciaUrl: evidenciaUrl || '',
  };

  mockStore.bitacoras.push(bitacora);
  return res.json({ message: 'Bitácora registrada exitosamente.', id: bitacora.id });
});

// POST /api/Estudiante/ayudantias/informe-mensual
estudianteRouter.post('/ayudantias/informe-mensual', (req, res) => {
  const estudianteId = req.user!.id;
  const { ayudantiaId, mes, anio } = req.body || {};

  if (!checkAyudantiaOwnership(ayudantiaId, estudianteId)) {
    return res.status(403).json({ message: 'No tienes permiso para realizar acciones sobre esta ayudantía.' });
  }

  const bitacoras = mockStore.bitacoras.filter((b) => {
    if (b.ayudantiaId !== ayudantiaId) return false;
    const date = new Date(b.fecha);
    return date.getUTCMonth() + 1 === mes && date.getUTCFullYear() === anio;
  });

  return res.json(bitacoras);
});

// GET /api/Estudiante/ayudantias/historial
estudianteRouter.get('/ayudantias/historial', (req, res) => {
  const estudianteId = req.user!.id;

  const ayudantias = mockStore.ayudantias.filter((a) => a.estudianteId === estudianteId);
  if (ayudantias.length === 0) {
    return res.status(404).json({ message: 'No se encontró historial de ayudantías para este estudiante.' });
  }

  const historial = ayudantias.map((a) => {
    const catedra = mockStore.catedras.find((c) => c.id === a.catedraId);
    const docente = mockStore.users.find((u) => u.id === catedra?.docenteId);
    const docenteName = docente?.persona
      ? `${docente.persona.nombre} ${docente.persona.apellido}`
      : 'Docente no asignado';

    return {
      ayudantiaId: a.id,
      estadoAyudantia: a.estado,
      catedraId: a.catedraId,
      nombreCatedra: catedra?.nombre || '',
      semestreCatedra: catedra?.semestre || '',
      docenteCatedra: docenteName,
    };
  });

  return res.json(historial);
});

// GET /api/Estudiante/:id/validacion-malla
estudianteRouter.get('/:id/validacion-malla', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const catedraId = req.query.catedraId ? parseInt(String(req.query.catedraId), 10) : undefined;

  const inscripciones = mockStore.inscripciones.filter((i) => i.estudianteId === id);
  if (inscripciones.length === 0) {
    return res.status(404).json({ message: 'Estudiante sin inscripciones registradas.' });
  }

  const totalCursos = mockStore.catedras.length;
  const cursosAprobados = inscripciones.filter((i) => i.promedioActual >= 60.0).length;
  const porcentajeAvance = totalCursos > 0 ? (cursosAprobados / totalCursos) * 100 : 0;
  const promedioGeneral =
    inscripciones.reduce((acc, curr) => acc + curr.promedioActual, 0) / inscripciones.length;

  let promedioCurso: number | null = null;
  if (catedraId != null) {
    const targetInsc = inscripciones.find((i) => i.catedraId === catedraId);
    promedioCurso = targetInsc ? targetInsc.promedioActual : null;
  }

  return res.json({
    estudianteId: id,
    porcentajeAvanceMalla: Math.round(porcentajeAvance * 100) / 100,
    cursosAprobados,
    totalCursos,
    promedioGeneral: Math.round(promedioGeneral * 100) / 100,
    promedioCurso: promedioCurso != null ? Math.round(promedioCurso * 100) / 100 : null,
    cursoId: catedraId || null,
    cumpleMalla: porcentajeAvance >= 50,
    cumplePromedioGeneral: promedioGeneral >= 60.0,
    cumplePromedioCurso: !catedraId || (promedioCurso != null && promedioCurso >= 60.0),
  });
});

// POST /api/Estudiante/actividades/:actividadId/entregar
estudianteRouter.post('/actividades/:actividadId/entregar', (upload.single('archivo') as any), (req, res) => {
  const estudianteId = req.user!.id;
  const actividadId = parseInt(String(req.params.actividadId), 10);

  const actividad = mockStore.actividades.find((a) => a.id === actividadId);
  if (!actividad) {
    return res.status(404).json({ message: 'Actividad no encontrada.' });
  }

  const fileName = req.file ? req.file.originalname : 'entrega_adjunta.pdf';
  const archivoUrl = `/uploads/entregas/actividad-${actividadId}/${fileName}`;

  let entrega = mockStore.actividadesRealizadas.find(
    (e) => e.estudianteId === estudianteId && e.actividadId === actividadId
  );

  if (!entrega) {
    entrega = {
      id: mockStore.getNextActividadRealizadaId(),
      estudianteId,
      actividadId,
      fechaRealizada: new Date().toISOString(),
      completada: true,
      archivoUrl,
    };
    mockStore.actividadesRealizadas.push(entrega);
  } else {
    entrega.fechaRealizada = new Date().toISOString();
    entrega.completada = true;
    entrega.archivoUrl = archivoUrl;
  }

  return res.json({ message: 'Entrega registrada correctamente.', archivoUrl });
});

// GET /api/Estudiante/mis-materias
estudianteRouter.get('/mis-materias', (req, res) => {
  const estudianteId = req.user!.id;

  const userInscripciones = mockStore.inscripciones.filter((i) => i.estudianteId === estudianteId);

  const materias = userInscripciones.map((i) => {
    const catedra = mockStore.catedras.find((c) => c.id === i.catedraId);
    const docente = mockStore.users.find((u) => u.id === catedra?.docenteId);
    const docenteName = docente?.persona
      ? `${docente.persona.nombre} ${docente.persona.apellido}`
      : 'Docente por asignar';

    return {
      id: catedra?.id || i.catedraId,
      codigo: catedra?.codigo || `CAT-${i.catedraId.toString().padStart(3, '0')}`,
      nombre: catedra?.nombre || 'Cátedra',
      descripcion: `Cátedra correspondiente al semestre ${catedra?.semestre || 'Regular'}`,
      docente: docenteName,
      creditos: 4,
      semana: 8,
      totalSemanas: 16,
      semestre: catedra?.semestre || 'Séptimo Semestre',
      grupo: 'Grupo A',
    };
  });

  return res.json(materias);
});

// POST /api/Estudiante/ayudantias/:ayudantiaId/bitacora-multipart
estudianteRouter.post(
  '/ayudantias/:ayudantiaId/bitacora-multipart',
  (upload.single('archivo') as any),
  (req, res) => {
    const estudianteId = req.user!.id;
    const ayudantiaId = parseInt(String(req.params.ayudantiaId), 10);

    if (!checkAyudantiaOwnership(ayudantiaId, estudianteId)) {
      return res.status(403).json({ message: 'No tienes permiso para realizar acciones sobre esta ayudantía.' });
    }

    const { actividadesRealizadas } = req.body || {};
    const evidenciaUrl = req.file
      ? `/uploads/bitacoras/ayudantia-${ayudantiaId}/${req.file.originalname}`
      : '';

    const bitacora: Bitacora = {
      id: mockStore.getNextBitacoraId(),
      ayudantiaId,
      fecha: new Date().toISOString(),
      actividadesRealizadas: actividadesRealizadas || '',
      evidenciaUrl,
    };

    mockStore.bitacoras.push(bitacora);
    return res.json({ message: 'Bitácora registrada con evidencia adjunta.', evidenciaUrl, id: bitacora.id });
  }
);
