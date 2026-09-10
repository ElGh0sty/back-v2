# SIGAC API (Sistema Integrado de Gestión Académica y Cátedras)

Backend REST API migrado y optimizado para Node.js / Express con autenticación JWT, control de acceso basado en roles (RBAC) y documentación interactiva OpenAPI / Swagger UI.

## Características

- **Autenticación y Seguridad:** JWT (JSON Web Tokens) con hashing seguro compatible y jerarquía de roles (Administrador, Decano, Coordinador, Docente, Estudiante, Jurado).
- **Gestión Académica:** Cátedras, asignaturas, clases y sesiones presenciales/virtuales con registro de asistencia.
- **Materiales y Actividades:** Carga de recursos educativos, seguimiento de recursos vistos por estudiantes y entregas de actividades calificadas.
- **Ayudantías de Cátedra:** Postulaciones con validación de promedio y requisitos de malla, bitácoras de tutoría con evidencias y seguimiento institucional.
- **Tribunal y Jurados:** Programación de presentaciones y registro de evaluaciones con cálculo automático de promedios.
- **Carga Masiva:** Importación masiva de estudiantes mediante archivos CSV y descarga de plantillas.
- **Swagger UI:** Documentación interactiva disponible en la raíz `/` y en `/swagger`.

## Usuarios de Prueba Preconfigurados

| Rol | Usuario | Contraseña |
| --- | --- | --- |
| **Administrador** | `admin` | `Admin123!` |
| **Docente** | `carlos.docente` | `Docente123!` |
| **Coordinador** | `elena.coordinador` | `Coord123!` |
| **Jurado** | `manuel.jurado` | `Jurado123!` |
| **Estudiante** | `jordy.estudiante` | `Estudiante123!` |

## Ejecución

```bash
# Desarrollo
npm run dev

# Compilación de producción
npm run build

# Inicio del servidor
npm start
```
