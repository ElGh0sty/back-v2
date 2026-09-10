import type {
  User,
  Persona,
  Catedra,
  Inscripcion,
  Clase,
  ClaseSesion,
  Asistencia,
  Recurso,
  RecursoVistoPorEstudiante,
  Actividad,
  EstudianteActividadRealizada,
  CronogramaActividad,
  Evaluacion,
  Ayudantia,
  ActividadAyudantia,
  Bitacora,
  Presentacion,
  PresentacionEvaluacion,
  ImportJob,
  ImportJobEntry,
} from '../types/index.js';
import { hashPassword } from '../services/tokenService.js';

class MockStore {
  users: User[] = [];
  personas: Persona[] = [];
  catedras: Catedra[] = [];
  inscripciones: Inscripcion[] = [];
  clases: Clase[] = [];
  clasesSesiones: ClaseSesion[] = [];
  asistencias: Asistencia[] = [];
  recursos: Recurso[] = [];
  recursosVistos: RecursoVistoPorEstudiante[] = [];
  actividades: Actividad[] = [];
  actividadesRealizadas: EstudianteActividadRealizada[] = [];
  cronogramas: CronogramaActividad[] = [];
  evaluaciones: Evaluacion[] = [];
  ayudantias: Ayudantia[] = [];
  actividadesAyudantia: ActividadAyudantia[] = [];
  bitacoras: Bitacora[] = [];
  presentaciones: Presentacion[] = [];
  presentacionEvaluaciones: PresentacionEvaluacion[] = [];
  importJobs: ImportJob[] = [];
  importJobEntries: ImportJobEntry[] = [];

  private nextUserId = 1;
  private nextPersonaId = 1;
  private nextCatedraId = 1;
  private nextClaseId = 1;
  private nextClaseSesionId = 1;
  private nextAsistenciaId = 1;
  private nextRecursoId = 1;
  private nextRecursoVistoId = 1;
  private nextActividadId = 1;
  private nextActividadRealizadaId = 1;
  private nextCronogramaId = 1;
  private nextEvaluacionId = 1;
  private nextAyudantiaId = 1;
  private nextActividadAyudantiaId = 1;
  private nextBitacoraId = 1;
  private nextPresentacionId = 1;
  private nextPresentacionEvalId = 1;
  private nextImportJobId = 1;
  private nextImportEntryId = 1;

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // 1. Admin
    const adminPass = hashPassword('Admin123!');
    const adminUser: User = {
      id: this.nextUserId++,
      username: 'admin',
      passwordHash: adminPass.hash,
      passwordSalt: adminPass.salt,
    };
    const adminPersona: Persona = {
      id: this.nextPersonaId++,
      nombre: 'Administrador',
      apellido: 'SIGAC',
      correo: 'admin@sigac.edu.ec',
      rol: 'Administrador',
      roles: ['Administrador'],
      userId: adminUser.id,
    };
    adminUser.persona = adminPersona;
    this.users.push(adminUser);
    this.personas.push(adminPersona);

    // 2. Docente
    const docentePass = hashPassword('Docente123!');
    const docenteUser: User = {
      id: this.nextUserId++,
      username: 'carlos.docente',
      passwordHash: docentePass.hash,
      passwordSalt: docentePass.salt,
    };
    const docentePersona: Persona = {
      id: this.nextPersonaId++,
      nombre: 'Carlos',
      apellido: 'Mendoza',
      correo: 'carlos.mendoza@sigac.edu.ec',
      rol: 'Docente',
      roles: ['Docente'],
      userId: docenteUser.id,
    };
    docenteUser.persona = docentePersona;
    this.users.push(docenteUser);
    this.personas.push(docentePersona);

    // 3. Coordinador
    const coordPass = hashPassword('Coord123!');
    const coordUser: User = {
      id: this.nextUserId++,
      username: 'elena.coordinador',
      passwordHash: coordPass.hash,
      passwordSalt: coordPass.salt,
    };
    const coordPersona: Persona = {
      id: this.nextPersonaId++,
      nombre: 'Elena',
      apellido: 'Paredes',
      correo: 'elena.paredes@sigac.edu.ec',
      rol: 'Coordinador',
      roles: ['Coordinador'],
      userId: coordUser.id,
    };
    coordUser.persona = coordPersona;
    this.users.push(coordUser);
    this.personas.push(coordPersona);

    // 4. Jurado
    const juradoPass = hashPassword('Jurado123!');
    const juradoUser: User = {
      id: this.nextUserId++,
      username: 'manuel.jurado',
      passwordHash: juradoPass.hash,
      passwordSalt: juradoPass.salt,
    };
    const juradoPersona: Persona = {
      id: this.nextPersonaId++,
      nombre: 'Manuel',
      apellido: 'Silva',
      correo: 'manuel.silva@sigac.edu.ec',
      rol: 'Jurado',
      roles: ['Jurado', 'Docente'],
      userId: juradoUser.id,
    };
    juradoUser.persona = juradoPersona;
    this.users.push(juradoUser);
    this.personas.push(juradoPersona);

    // 5. Estudiante
    const estPass = hashPassword('Estudiante123!');
    const estUser: User = {
      id: this.nextUserId++,
      username: 'jordy.estudiante',
      passwordHash: estPass.hash,
      passwordSalt: estPass.salt,
    };
    const estPersona: Persona = {
      id: this.nextPersonaId++,
      nombre: 'Jordy Fabian',
      apellido: 'Rivas Bodero',
      correo: 'jordy@example.com',
      rol: 'Estudiante',
      roles: ['Estudiante'],
      userId: estUser.id,
    };
    estUser.persona = estPersona;
    this.users.push(estUser);
    this.personas.push(estPersona);

    // Seed Materias/Catedras
    const catedra1: Catedra = {
      id: this.nextCatedraId++,
      nombre: 'Ingeniería de Software II',
      codigo: 'CAT-001',
      semestre: 'Séptimo Semestre',
      docenteId: docenteUser.id,
      minimoNota: 75.0,
    };
    const catedra2: Catedra = {
      id: this.nextCatedraId++,
      nombre: 'Arquitectura de Datos y Cloud Computing',
      codigo: 'CAT-002',
      semestre: 'Octavo Semestre',
      docenteId: docenteUser.id,
      minimoNota: 70.0,
    };
    this.catedras.push(catedra1, catedra2);

    // Inscribir estudiante
    this.inscripciones.push({
      estudianteId: estUser.id,
      catedraId: catedra1.id,
      promedioActual: 88.5,
    });
    this.inscripciones.push({
      estudianteId: estUser.id,
      catedraId: catedra2.id,
      promedioActual: 82.0,
    });

    // Seed Clase
    const clase1: Clase = {
      id: this.nextClaseId++,
      nombre: 'Paralelo A - Ingeniería de Software',
      materiaId: catedra1.id,
      docenteId: docenteUser.id,
      estudianteIds: [estUser.id],
    };
    this.clases.push(clase1);

    // Seed ClaseSesion
    const sesion1: ClaseSesion = {
      id: this.nextClaseSesionId++,
      materiaId: catedra1.id,
      claseId: clase1.id,
      docenteId: docenteUser.id,
      fecha: '2026-09-15',
      horaInicio: '08:00',
      horaFin: '10:00',
      tipoClase: 'Presencial',
      edificioPresencial: 'Edificio de Tecnologías',
      aulaPresencial: 'Laboratorio 3',
      pisoPresencial: 'Segundo Piso',
    };
    this.clasesSesiones.push(sesion1);

    // Seed Recursos
    this.recursos.push({
      id: this.nextRecursoId++,
      titulo: 'Guía de Arquitectura de Microservicios',
      descripcion: 'Material de lectura sobre diseño desacoplado y APIs REST.',
      url: 'https://sigac.edu.ec/recursos/guia-microservicios.pdf',
      esEsencial: true,
      materiaId: catedra1.id,
    });
    this.recursos.push({
      id: this.nextRecursoId++,
      titulo: 'Documentación Oficial Swagger/OpenAPI',
      descripcion: 'Especificación de endpoints y contratos de datos.',
      url: 'https://swagger.io/docs/',
      esEsencial: false,
      materiaId: catedra1.id,
    });

    // Seed Actividades
    this.actividades.push({
      id: this.nextActividadId++,
      titulo: 'Taller 1: Implementación de Modelo de Dominio',
      descripcion: 'Diseñar e implementar entidades y DTOs del sistema SIGAC.',
      fechaEntrega: '2026-09-20',
      tipo: 'Taller Práctico',
      estado: 'Pendiente',
      materiaId: catedra1.id,
    });

    // Seed Ayudantia
    const ayudantia1: Ayudantia = {
      id: this.nextAyudantiaId++,
      catedraId: catedra1.id,
      estudianteId: estUser.id,
      estado: 'Activa',
    };
    this.ayudantias.push(ayudantia1);

    this.actividadesAyudantia.push({
      id: this.nextActividadAyudantiaId++,
      ayudantiaId: ayudantia1.id,
      descripcion: 'Refuerzo de consultas LINQ y validaciones a estudiantes de primer ciclo',
      fechaPlanificada: '2026-09-18',
      completada: false,
    });

    this.bitacoras.push({
      id: this.nextBitacoraId++,
      ayudantiaId: ayudantia1.id,
      fecha: new Date().toISOString(),
      actividadesRealizadas: 'Sesión de tutoría sobre modelado entidad relación y DTOs.',
      evidenciaUrl: 'https://sigac.edu.ec/evidencias/tutoria_1.pdf',
    });

    // Seed Presentacion
    this.presentaciones.push({
      id: this.nextPresentacionId++,
      ayudantiaId: ayudantia1.id,
      fecha: '2026-09-25T10:00:00Z',
      juradoIds: [juradoUser.id, docenteUser.id],
      coordinadorCarreraId: coordUser.id,
      decanoId: adminUser.id,
    });
  }

  // Helper generators
  getNextUserId() {
    return this.nextUserId++;
  }
  getNextPersonaId() {
    return this.nextPersonaId++;
  }
  getNextCatedraId() {
    return this.nextCatedraId++;
  }
  getNextClaseId() {
    return this.nextClaseId++;
  }
  getNextClaseSesionId() {
    return this.nextClaseSesionId++;
  }
  getNextAsistenciaId() {
    return this.nextAsistenciaId++;
  }
  getNextRecursoId() {
    return this.nextRecursoId++;
  }
  getNextRecursoVistoId() {
    return this.nextRecursoVistoId++;
  }
  getNextActividadId() {
    return this.nextActividadId++;
  }
  getNextActividadRealizadaId() {
    return this.nextActividadRealizadaId++;
  }
  getNextCronogramaId() {
    return this.nextCronogramaId++;
  }
  getNextEvaluacionId() {
    return this.nextEvaluacionId++;
  }
  getNextAyudantiaId() {
    return this.nextAyudantiaId++;
  }
  getNextActividadAyudantiaId() {
    return this.nextActividadAyudantiaId++;
  }
  getNextBitacoraId() {
    return this.nextBitacoraId++;
  }
  getNextPresentacionId() {
    return this.nextPresentacionId++;
  }
  getNextPresentacionEvalId() {
    return this.nextPresentacionEvalId++;
  }
  getNextImportJobId() {
    return this.nextImportJobId++;
  }
  getNextImportEntryId() {
    return this.nextImportEntryId++;
  }
}

export const mockStore = new MockStore();
