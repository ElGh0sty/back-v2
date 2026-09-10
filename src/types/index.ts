export interface Persona {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  rol: string;
  roles: string[];
  userId: number;
}

export interface User {
  id: number;
  username: string;
  passwordHash: string;
  passwordSalt: string;
  persona?: Persona;
}

export interface Catedra {
  id: number;
  nombre: string;
  codigo?: string;
  semestre: string;
  docenteId: number;
  minimoNota?: number;
}

export interface Inscripcion {
  estudianteId: number;
  catedraId: number;
  promedioActual: number;
}

export interface Clase {
  id: number;
  nombre: string;
  materiaId: number;
  docenteId: number;
  estudianteIds: number[];
}

export interface ClaseSesion {
  id: number;
  materiaId: number;
  claseId?: number;
  docenteId: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tipoClase: string;
  linkVirtual?: string;
  aplicacionVirtual?: string;
  edificioPresencial?: string;
  aulaPresencial?: string;
  pisoPresencial?: string;
}

export interface Asistencia {
  id: number;
  claseSesionId: number;
  estudianteId: number;
  presente: boolean;
}

export interface Recurso {
  id: number;
  titulo: string;
  descripcion: string;
  url: string;
  esEsencial: boolean;
  materiaId: number;
}

export interface RecursoVistoPorEstudiante {
  id: number;
  recursoId: number;
  estudianteId: number;
  fechaVisto: string;
}

export interface Actividad {
  id: number;
  titulo: string;
  descripcion: string;
  fechaEntrega: string;
  tipo: string;
  estado: string;
  materiaId: number;
}

export interface EstudianteActividadRealizada {
  id: number;
  estudianteId: number;
  actividadId: number;
  fechaRealizada: string;
  completada: boolean;
  calificacion?: number;
  retroalimentacion?: string;
  archivoUrl?: string;
}

export interface CronogramaActividad {
  id: number;
  catedraId: number;
  descripcion: string;
  fechaPrevista: string;
  fechaReal?: string;
}

export interface Evaluacion {
  id: number;
  catedraId: number;
  nombre: string;
  esDiagnostica: boolean;
  adaptadaConIA: boolean;
}

export interface Ayudantia {
  id: number;
  catedraId: number;
  estudianteId: number;
  estado: string; // "Pendiente" | "Activa" | "Finalizada" | "Rechazada"
}

export interface ActividadAyudantia {
  id: number;
  ayudantiaId: number;
  descripcion: string;
  fechaPlanificada: string;
  completada: boolean;
}

export interface Bitacora {
  id: number;
  ayudantiaId: number;
  fecha: string;
  actividadesRealizadas: string;
  evidenciaUrl?: string;
}

export interface Presentacion {
  id: number;
  ayudantiaId: number;
  fecha: string;
  juradoIds: number[];
  decanoId?: number;
  coordinadorCarreraId?: number;
}

export interface PresentacionEvaluacion {
  id: number;
  presentacionId: number;
  juradoId: number;
  nota: number;
  observaciones?: string;
  fecha: string;
}

export interface ImportJob {
  id: number;
  createdByUserId: number;
  createdAt: string;
  fileName: string;
  createdCount: number;
  errorCount: number;
  resultFileName?: string;
}

export interface ImportJobEntry {
  id: number;
  importJobId: number;
  nombres: string;
  apellidos: string;
  cedula: string;
  correo: string;
  username?: string;
  success: boolean;
  errorMessage?: string;
}

export interface AuthUserContext {
  id: number;
  username: string;
  roles: string[];
}
