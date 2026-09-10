import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRoles } from '../middleware/authMiddleware.js';
import { mockStore } from '../data/mockStore.js';
import { hashPassword } from '../services/tokenService.js';
import type { ImportJob, ImportJobEntry, User, Persona } from '../types/index.js';

const upload = multer({ storage: multer.memoryStorage() });

export const estudiantesBulkRouter = Router();

estudiantesBulkRouter.use(requireAuth);

// GET /api/estudiantes/template
estudiantesBulkRouter.get('/template', (_req, res) => {
  const csvContent =
    'Nombres,Apellidos,Cedula,Correo,MateriaId\nJuan Alberto,Perez Gomez,1203456789,juan.perez@sigac.edu.ec,1\nMaria Belen,Lopez Zambrano,1209876543,maria.lopez@sigac.edu.ec,1';

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=plantilla_estudiantes.csv');
  return res.send(csvContent);
});

// GET /api/estudiantes/presentaciones
estudiantesBulkRouter.get('/presentaciones', (_req, res) => {
  return res.json(mockStore.presentaciones);
});

// POST /api/estudiantes/bulk-upload
estudiantesBulkRouter.post(
  '/bulk-upload',
  requireRoles('Administrador', 'Coordinador', 'Decano'),
  (upload.single('file') as any),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha adjuntado ningún archivo CSV o Excel.' });
    }

    const fileContent = req.file.buffer.toString('utf-8');
    const lines = fileContent.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    if (lines.length <= 1) {
      return res.status(400).json({ message: 'El archivo está vacío o solo contiene la cabecera.' });
    }

    const job: ImportJob = {
      id: mockStore.getNextImportJobId(),
      createdByUserId: req.user!.id,
      createdAt: new Date().toISOString(),
      fileName: req.file.originalname,
      createdCount: 0,
      errorCount: 0,
    };
    mockStore.importJobs.push(job);

    const rows = lines.slice(1);
    let createdCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      const parts = row.split(',').map((p) => p.trim());
      const [nombres, apellidos, cedula, correo, materiaIdStr] = parts;

      const entry: ImportJobEntry = {
        id: mockStore.getNextImportEntryId(),
        importJobId: job.id,
        nombres: nombres || '',
        apellidos: apellidos || '',
        cedula: cedula || '',
        correo: correo || '',
        success: false,
      };

      if (!nombres || !apellidos || !correo) {
        entry.errorMessage = 'Campos obligatorios incompletos (Nombres, Apellidos, Correo).';
        errorCount++;
        mockStore.importJobEntries.push(entry);
        continue;
      }

      const cleanUser = (nombres.split(' ')[0] + '.' + apellidos.split(' ')[0]).toLowerCase().replace(/[^a-z0-9]/g, '');
      let finalUsername = cleanUser;
      let counter = 1;
      while (mockStore.users.some((u) => u.username === finalUsername)) {
        finalUsername = `${cleanUser}${counter++}`;
      }

      const pass = hashPassword('Estudiante2026!');
      const newUser: User = {
        id: mockStore.getNextUserId(),
        username: finalUsername,
        passwordHash: pass.hash,
        passwordSalt: pass.salt,
      };

      const newPersona: Persona = {
        id: mockStore.getNextPersonaId(),
        nombre: nombres,
        apellido: apellidos,
        correo: correo,
        rol: 'Estudiante',
        roles: ['Estudiante'],
        userId: newUser.id,
      };

      newUser.persona = newPersona;
      mockStore.users.push(newUser);
      mockStore.personas.push(newPersona);

      if (materiaIdStr) {
        const matId = parseInt(materiaIdStr, 10);
        if (!isNaN(matId)) {
          mockStore.inscripciones.push({
            estudianteId: newUser.id,
            catedraId: matId,
            promedioActual: 70.0,
          });
        }
      }

      entry.username = finalUsername;
      entry.success = true;
      createdCount++;
      mockStore.importJobEntries.push(entry);
    }

    job.createdCount = createdCount;
    job.errorCount = errorCount;

    return res.json({
      jobId: job.id,
      totalProcesados: rows.length,
      creados: createdCount,
      errores: errorCount,
      mensaje: `Carga masiva procesada: ${createdCount} creados, ${errorCount} errores.`,
    });
  }
);

// GET /api/estudiantes/imports/:jobId/result
estudiantesBulkRouter.get('/imports/:jobId/result', (req, res) => {
  const jobId = parseInt(req.params.jobId, 10);
  const entries = mockStore.importJobEntries.filter((e) => e.importJobId === jobId);

  if (entries.length === 0) {
    return res.status(404).json({ message: 'Lote de importación no encontrado.' });
  }

  let csv = 'Nombres,Apellidos,Cedula,Correo,UsernameGenerado,Estado,Error\n';
  for (const e of entries) {
    csv += `"${e.nombres}","${e.apellidos}","${e.cedula}","${e.correo}","${e.username || ''}","${
      e.success ? 'EXITOSO' : 'FALLIDO'
    }","${e.errorMessage || ''}"\n`;
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=resultado_importacion_${jobId}.csv`);
  return res.send(csv);
});
