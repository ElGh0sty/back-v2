export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'SIGAC API V1',
    version: '1.0.0',
    description:
      'API REST del Sistema Integrado de Gestión Académica y Cátedras (SIGAC). Incluye autenticación con JWT, control de acceso basado en roles (RBAC), gestión de clases, sesiones, recursos, actividades, ayudantías y jurados.',
  },
  servers: [
    {
      url: '/',
      description: 'Servidor Actual',
    },
  ],
  components: {
    securitySchemes: {
      Bearer: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Ingrese su token JWT sin el prefijo "Bearer "',
      },
    },
    schemas: {
      LoginDto: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', example: 'admin' },
          password: { type: 'string', example: 'Admin123!' },
        },
      },
      RegisterDto: {
        type: 'object',
        required: ['username', 'password', 'rol'],
        properties: {
          username: { type: 'string', example: 'nuevo.usuario' },
          password: { type: 'string', example: 'ClaveSegura123!' },
          nombre: { type: 'string', example: 'Nombre' },
          apellido: { type: 'string', example: 'Apellido' },
          correo: { type: 'string', example: 'usuario@sigac.edu.ec' },
          rol: { type: 'string', example: 'Docente' },
          roles: {
            type: 'array',
            items: { type: 'string' },
            example: ['Docente'],
          },
        },
      },
      UserDto: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          username: { type: 'string' },
          token: { type: 'string' },
          roles: { type: 'array', items: { type: 'string' } },
          rol: { type: 'string' },
          nombre: { type: 'string' },
          apellido: { type: 'string' },
          correo: { type: 'string' },
        },
      },
      PersonaDto: {
        type: 'object',
        properties: {
          nombre: { type: 'string' },
          apellido: { type: 'string' },
          correo: { type: 'string' },
        },
      },
      CreateClaseDto: {
        type: 'object',
        required: ['nombre', 'materiaId', 'docenteId'],
        properties: {
          nombre: { type: 'string', example: 'Paralelo B - POO' },
          materiaId: { type: 'integer', example: 1 },
          docenteId: { type: 'integer', example: 2 },
          estudianteIds: {
            type: 'array',
            items: { type: 'integer' },
            example: [5],
          },
        },
      },
      CreateClaseSesionDto: {
        type: 'object',
        required: ['materiaId', 'fecha', 'horaInicio', 'horaFin', 'tipoClase'],
        properties: {
          materiaId: { type: 'integer', example: 1 },
          claseId: { type: 'integer', example: 1 },
          fecha: { type: 'string', example: '2026-09-18' },
          horaInicio: { type: 'string', example: '08:00' },
          horaFin: { type: 'string', example: '10:00' },
          tipoClase: { type: 'string', example: 'Presencial' },
          edificioPresencial: { type: 'string', example: 'Edificio Central' },
          aulaPresencial: { type: 'string', example: 'Aula 204' },
          pisoPresencial: { type: 'string', example: 'Piso 2' },
          linkVirtual: { type: 'string', example: 'https://meet.google.com/abc-defg-hij' },
          aplicacionVirtual: { type: 'string', example: 'Google Meet' },
        },
      },
      CreateRecursoDto: {
        type: 'object',
        required: ['titulo', 'url'],
        properties: {
          titulo: { type: 'string', example: 'Guía de Laboratorio' },
          descripcion: { type: 'string', example: 'Instrucciones para el taller' },
          url: { type: 'string', example: 'https://ejemplo.com/guia.pdf' },
          esEsencial: { type: 'boolean', example: true },
        },
      },
      CreateActividadDto: {
        type: 'object',
        required: ['titulo'],
        properties: {
          titulo: { type: 'string', example: 'Proyecto Final - Fase 1' },
          descripcion: { type: 'string', example: 'Entregar repositorio y documentación' },
          fechaEntrega: { type: 'string', example: '2026-10-01' },
          tipo: { type: 'string', example: 'Proyecto' },
        },
      },
    },
  },
  security: [{ Bearer: [] }],
  paths: {
    '/api/health': {
      get: {
        summary: 'Estado de salud del servicio',
        security: [],
        responses: {
          200: { description: 'API operativa' },
        },
      },
    },
    '/api/Login/login': {
      post: {
        summary: 'Iniciar sesión (JWT)',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginDto' },
            },
          },
        },
        responses: {
          200: { description: 'Login exitoso', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserDto' } } } },
          401: { description: 'Credenciales inválidas' },
        },
      },
    },
    '/api/Login/register': {
      post: {
        summary: 'Registrar nuevo usuario con rol y persona asociada',
        security: [{ Bearer: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterDto' },
            },
          },
        },
        responses: {
          200: { description: 'Usuario registrado exitosamente' },
          400: { description: 'Datos inválidos' },
          403: { description: 'Jerarquía de roles no autorizada' },
        },
      },
    },
    '/api/Persona': {
      get: {
        summary: 'Obtener datos de la persona del usuario actual',
        responses: {
          200: { description: 'Datos de la persona' },
        },
      },
      put: {
        summary: 'Actualizar datos de la persona del usuario actual',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PersonaDto' },
            },
          },
        },
        responses: {
          200: { description: 'Actualizado exitosamente' },
        },
      },
    },
    '/api/roles/{userId}': {
      put: {
        summary: 'Actualizar roles de un usuario (Admin/Coordinador/Docente según jerarquía)',
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  roles: { type: 'array', items: { type: 'string' } },
                  rol: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Roles actualizados' },
          403: { description: 'No autorizado según jerarquía' },
        },
      },
    },
    '/api/Materia/{materiaId}/recursos': {
      get: {
        summary: 'Listar recursos de una materia',
        parameters: [{ name: 'materiaId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Lista de recursos' } },
      },
      post: {
        summary: 'Añadir recurso a una materia (Docente responsable)',
        parameters: [{ name: 'materiaId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateRecursoDto' } } },
        },
        responses: { 201: { description: 'Recurso creado' } },
      },
    },
    '/api/Materia/{materiaId}/actividades': {
      get: {
        summary: 'Listar actividades de una materia',
        parameters: [{ name: 'materiaId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Lista de actividades' } },
      },
      post: {
        summary: 'Crear actividad en una materia (Docente responsable)',
        parameters: [{ name: 'materiaId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateActividadDto' } } },
        },
        responses: { 201: { description: 'Actividad creada' } },
      },
    },
    '/api/Materia/recursos/marcar-visto': {
      post: {
        summary: 'Marcar recurso como visto por el estudiante',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { recursoId: { type: 'integer' } } } } },
        },
        responses: { 200: { description: 'Recurso marcado como visto' } },
      },
    },
    '/api/Materia/{materiaId}/recursos/estado': {
      get: {
        summary: 'Listar recursos con indicador de si el estudiante los ha visto',
        parameters: [{ name: 'materiaId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Recursos con estado visto' } },
      },
    },
    '/api/Clase': {
      post: {
        summary: 'Crear nueva clase (Docente)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateClaseDto' } } },
        },
        responses: { 201: { description: 'Clase creada' } },
      },
    },
    '/api/Clase/{id}': {
      get: {
        summary: 'Obtener información de una clase',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Detalle de la clase' } },
      },
    },
    '/api/Clase/{claseId}/estudiantes': {
      get: {
        summary: 'Listar estudiantes matriculados en la clase',
        parameters: [{ name: 'claseId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Estudiantes de la clase' } },
      },
      post: {
        summary: 'Añadir estudiantes a la clase (Docente)',
        parameters: [{ name: 'claseId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'array', items: { type: 'integer' } } } },
        },
        responses: { 200: { description: 'Estudiantes añadidos' } },
      },
    },
    '/api/ClaseSesion': {
      post: {
        summary: 'Crear nueva sesión de clase (Docente)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateClaseSesionDto' } } },
        },
        responses: { 201: { description: 'Sesión creada' } },
      },
    },
    '/api/ClaseSesion/{id}': {
      get: {
        summary: 'Obtener detalle de sesión de clase',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Detalle de sesión' } },
      },
    },
    '/api/ClaseSesion/{claseSesionId}/asistencia': {
      get: {
        summary: 'Ver asistencias de la sesión (Docente)',
        parameters: [{ name: 'claseSesionId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Lista de asistencia' } },
      },
      post: {
        summary: 'Registrar asistencia de un estudiante',
        parameters: [{ name: 'claseSesionId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { estudianteId: { type: 'integer' }, presente: { type: 'boolean' } },
              },
            },
          },
        },
        responses: { 201: { description: 'Asistencia registrada' } },
      },
    },
    '/api/Estudiante/mis-materias': {
      get: {
        summary: 'Listar materias en las que el estudiante está inscrito',
        responses: { 200: { description: 'Materias inscritas' } },
      },
    },
    '/api/Estudiante/ayudantias/postulaciones': {
      post: {
        summary: 'Postular a una ayudantía de cátedra',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { catedraId: { type: 'integer' } } } } },
        },
        responses: { 200: { description: 'Postulación enviada' } },
      },
    },
    '/api/Estudiante/ayudantias/bitacora': {
      post: {
        summary: 'Registrar bitácora de actividades realizadas',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ayudantiaId: { type: 'integer' },
                  actividadesRealizadas: { type: 'string' },
                  evidenciaUrl: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Bitácora guardada' } },
      },
    },
    '/api/Estudiante/ayudantias/historial': {
      get: {
        summary: 'Historial de ayudantías del estudiante',
        responses: { 200: { description: 'Historial de ayudantías' } },
      },
    },
    '/api/Estudiante/{id}/validacion-malla': {
      get: {
        summary: 'Validar avance curricular y notas mínimas para ayudantía',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'catedraId', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'Resultado de validación curricular' } },
      },
    },
    '/api/Docente/ayudantias/{ayudantiaId}/monitoreo': {
      get: {
        summary: 'Monitorear actividades y bitácoras de un ayudante',
        parameters: [{ name: 'ayudantiaId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Reporte de monitoreo' } },
      },
    },
    '/api/Docente/actividades/{actividadId}/entregas': {
      get: {
        summary: 'Listar entregas de estudiantes para una actividad',
        parameters: [{ name: 'actividadId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Lista de entregas' } },
      },
    },
    '/api/Docente/actividades/calificar': {
      post: {
        summary: 'Calificar la entrega de un estudiante',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  entregaId: { type: 'integer' },
                  calificacion: { type: 'number' },
                  retroalimentacion: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Calificación asignada' } },
      },
    },
    '/api/Coordinador/ayudantias/solicitudes': {
      get: {
        summary: 'Listar solicitudes de ayudantía pendientes de aprobación',
        responses: { 200: { description: 'Lista de solicitudes pendientes' } },
      },
    },
    '/api/Coordinador/ayudantias/asignar': {
      post: {
        summary: 'Aprobar y asignar ayudantía a un estudiante',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { ayudantiaId: { type: 'integer' } } } } },
        },
        responses: { 200: { description: 'Ayudantía asignada' } },
      },
    },
    '/api/Jurado/presentaciones': {
      get: {
        summary: 'Listar presentaciones programadas',
        responses: { 200: { description: 'Lista de presentaciones' } },
      },
      post: {
        summary: 'Programar nueva presentación de ayudantía',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ayudantiaId: { type: 'integer' },
                  fecha: { type: 'string' },
                  juradoIds: { type: 'array', items: { type: 'integer' } },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Presentación programada' } },
      },
    },
    '/api/Jurado/presentaciones/{presentacionId}/evaluaciones': {
      post: {
        summary: 'Registrar evaluación de jurado con nota y observaciones',
        parameters: [{ name: 'presentacionId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nota: { type: 'number' },
                  observaciones: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Evaluación registrada' } },
      },
    },
    '/api/Jurado/presentaciones/{presentacionId}/resultado': {
      get: {
        summary: 'Obtener promedio y veredicto final de la presentación',
        parameters: [{ name: 'presentacionId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Resultado final de la presentación' } },
      },
    },
    '/api/estudiantes/template': {
      get: {
        summary: 'Descargar plantilla CSV para carga masiva de estudiantes',
        responses: { 200: { description: 'Archivo CSV' } },
      },
    },
    '/api/estudiantes/bulk-upload': {
      post: {
        summary: 'Carga masiva de estudiantes mediante archivo CSV',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Resultado del proceso de importación' } },
      },
    },
  },
};
