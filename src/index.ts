import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

import { extractAuth } from './middleware/authMiddleware.js';
import { swaggerSpec } from './docs/swaggerSpec.js';

import { loginRouter } from './controllers/loginController.js';
import { personaRouter } from './controllers/personaController.js';
import { rolesRouter } from './controllers/rolesController.js';
import { materiaRouter } from './controllers/materiaController.js';
import { claseRouter } from './controllers/claseController.js';
import { claseSesionRouter } from './controllers/claseSesionController.js';
import { estudianteRouter } from './controllers/estudianteController.js';
import { docenteRouter } from './controllers/docenteController.js';
import { coordinadorRouter } from './controllers/coordinadorController.js';
import { juradoRouter } from './controllers/juradoController.js';
import { estudiantesBulkRouter } from './controllers/estudiantesBulkController.js';

const app = express();
const PORT = 3000;

// CORS setup matching ASP.NET Core Program.cs
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(extractAuth);

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'SIGAC API REST',
    timestamp: new Date().toISOString(),
  });
});

// Swagger JSON endpoint matching ASP.NET Core Swashbuckle
app.get('/swagger/v1/swagger.json', (_req: Request, res: Response) => {
  res.json(swaggerSpec);
});

// Swagger UI at root and /swagger
app.use('/swagger', ...(swaggerUi.serve as any), swaggerUi.setup(swaggerSpec) as any);
app.use('/', ...(swaggerUi.serve as any));
app.get('/', swaggerUi.setup(swaggerSpec) as any);

// Routers mounted with both PascalCase (ASP.NET default) and lowercase paths
const routes = [
  { path: 'Login', router: loginRouter },
  { path: 'login', router: loginRouter },
  { path: 'Persona', router: personaRouter },
  { path: 'persona', router: personaRouter },
  { path: 'roles', router: rolesRouter },
  { path: 'Roles', router: rolesRouter },
  { path: 'Materia', router: materiaRouter },
  { path: 'materia', router: materiaRouter },
  { path: 'Clase', router: claseRouter },
  { path: 'clase', router: claseRouter },
  { path: 'ClaseSesion', router: claseSesionRouter },
  { path: 'clasesesion', router: claseSesionRouter },
  { path: 'clase-sesion', router: claseSesionRouter },
  { path: 'Estudiante', router: estudianteRouter },
  { path: 'estudiante', router: estudianteRouter },
  { path: 'Docente', router: docenteRouter },
  { path: 'docente', router: docenteRouter },
  { path: 'Coordinador', router: coordinadorRouter },
  { path: 'coordinador', router: coordinadorRouter },
  { path: 'Jurado', router: juradoRouter },
  { path: 'jurado', router: juradoRouter },
  { path: 'estudiantes', router: estudiantesBulkRouter },
  { path: 'Estudiantes', router: estudiantesBulkRouter },
];

for (const route of routes) {
  app.use(`/api/${route.path}`, route.router);
}

// 404 handler for API routes
app.use('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ message: 'Ruta no encontrada en SIGAC API' });
});

// Error handling middleware matching ExceptionMiddleware.cs
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('API Error:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    statusCode,
    message: err.message || 'Error interno del servidor',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SIGAC API running at http://0.0.0.0:${PORT}`);
  console.log(`Swagger UI available at http://0.0.0.0:${PORT}/`);
});
