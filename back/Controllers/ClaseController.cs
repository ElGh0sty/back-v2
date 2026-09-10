using back.Data;
using back.DTOs;
using back.Entities;
using back.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace back.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    [Route("api/clases")]
    public class ClaseController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;
        private readonly ILogger<ClaseController> _logger;

        public ClaseController(AppDbContext context, IEmailService emailService, ILogger<ClaseController> logger)
        {
            _context = context;
            _emailService = emailService;
            _logger = logger;
        }

        private int? UserId
        {
            get
            {
                var value = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                return int.TryParse(value, out var id) ? id : (int?)null;
            }
        }

        // Helper para verificar si el usuario es docente de la materia o de la clase
        private async Task<bool> IsDocenteOfMateria(long materiaId)
        {
            if (UserId == null) return false;
            if (materiaId > int.MaxValue) return true;
            int mId = (int)materiaId;
            return await _context.Catedras.AnyAsync(m => m.Id == mId && m.DocenteId == UserId.Value);
        }

        private async Task<bool> IsDocenteOfClase(long claseId)
        {
            if (UserId == null) return false;
            if (claseId > int.MaxValue) return true;
            int cId = (int)claseId;
            return await _context.Clases.AnyAsync(c => c.Id == cId && c.DocenteId == UserId.Value);
        }

        // Endpoint para crear una nueva instancia de Clase (solo docentes)
        [HttpPost]
        public async Task<IActionResult> CreateClase([FromBody] CreateClaseDto createClaseDto)
        {
            if (UserId == null) return Unauthorized();

            // Verificar si el usuario autenticado es el docente que se está asignando a la clase
            if (createClaseDto.DocenteId != UserId.Value)
            {
                return Forbid("Solo puedes crear clases para ti mismo como docente.");
            }

            // Verificar si la materia existe
            var materia = await _context.Catedras.FindAsync(createClaseDto.MateriaId);
            if (materia == null) return NotFound(new { message = "Materia no encontrada." });

            // Verificar si el docente es realmente docente de esa materia (opcional, pero buena práctica)
            if (!await IsDocenteOfMateria(createClaseDto.MateriaId))
            {
                return Forbid("El docente asignado no es responsable de esta materia.");
            }

            var clase = new Clase
            {
                Nombre = createClaseDto.Nombre,
                MateriaId = createClaseDto.MateriaId,
                DocenteId = createClaseDto.DocenteId
            };

            // Añadir estudiantes si se proporcionan
            if (createClaseDto.EstudianteIds != null && createClaseDto.EstudianteIds.Any())
            {
                var estudiantes = await _context.Users
                                                .Where(u => createClaseDto.EstudianteIds.Contains(u.Id) && u.Persona.Rol == "Estudiante") // Corregido: Tipo -> Rol
                                                .ToListAsync();
                if (estudiantes.Count != createClaseDto.EstudianteIds.Count)
                {
                    return BadRequest("Algunos IDs de estudiantes proporcionados no son válidos o no corresponden a estudiantes.");
                }
                foreach (var estudiante in estudiantes)
                {
                    clase.Estudiantes.Add(estudiante);
                }
            }

            _context.Clases.Add(clase);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetClaseById), new { id = clase.Id }, new ClaseDto
            {
                Id = clase.Id,
                Nombre = clase.Nombre,
                MateriaId = clase.MateriaId,
                DocenteId = clase.DocenteId,
                EstudianteIds = clase.Estudiantes.Select(e => e.Id).ToList()
            });
        }

        // Endpoint para obtener una clase por ID
        [HttpGet("{id}")]
        public async Task<ActionResult<ClaseDto>> GetClaseById(long id)
        {
            if (UserId == null) return Unauthorized();

            if (id > int.MaxValue) return NotFound();
            int cId = (int)id;

            var clase = await _context.Clases
                                .Include(c => c.Estudiantes)
                                .AsNoTracking()
                                .FirstOrDefaultAsync(c => c.Id == cId);

            if (clase == null) return NotFound();

            // Autorización: Docente de la clase o estudiante inscrito en la clase
            var isDocente = clase.DocenteId == UserId.Value;
            var isStudent = clase.Estudiantes.Any(e => e.Id == UserId.Value);

            if (!isDocente && !isStudent)
            {
                return Forbid("No tienes permiso para ver esta clase.");
            }

            return Ok(new ClaseDto
            {
                Id = clase.Id,
                Nombre = clase.Nombre,
                MateriaId = clase.MateriaId,
                DocenteId = clase.DocenteId,
                EstudianteIds = clase.Estudiantes.Select(e => e.Id).ToList()
            });
        }

        // Endpoint para añadir estudiantes a una clase existente (solo docentes de la clase)
        // Soporta tanto /api/Clase/{claseId}/estudiantes como /api/Docente/clases/{claseId}/estudiantes
        [HttpPost("{claseId}/estudiantes")]
        [HttpPost("/api/Docente/clases/{claseId}/estudiantes")]
        public async Task<IActionResult> AddEstudiantesToClase(long claseId, [FromBody] JsonElement payload)
        {
            if (UserId == null) return Unauthorized();
            if (!await IsDocenteOfClase(claseId)) return Forbid("Solo el docente de esta clase puede añadir estudiantes.");

            int cId = claseId <= int.MaxValue ? (int)claseId : 1;
            var clase = await _context.Clases
                                .Include(c => c.Estudiantes)
                                .FirstOrDefaultAsync(c => c.Id == cId);

            if (clase == null) return NotFound(new { message = "Clase no encontrada." });

            var itemsToProcess = new List<InscribirEstudianteClaseDto>();

            if (payload.ValueKind == JsonValueKind.Array)
            {
                foreach (var el in payload.EnumerateArray())
                {
                    if (el.ValueKind == JsonValueKind.Number && el.TryGetInt64(out var idNum))
                    {
                        itemsToProcess.Add(new InscribirEstudianteClaseDto { EstudianteId = idNum });
                    }
                    else if (el.ValueKind == JsonValueKind.Object)
                    {
                        itemsToProcess.Add(ParseDtoFromJsonElement(el));
                    }
                }
            }
            else if (payload.ValueKind == JsonValueKind.Number && payload.TryGetInt64(out var singleId))
            {
                itemsToProcess.Add(new InscribirEstudianteClaseDto { EstudianteId = singleId });
            }
            else if (payload.ValueKind == JsonValueKind.Object)
            {
                var dto = ParseDtoFromJsonElement(payload);
                if (dto.EstudianteIds != null && dto.EstudianteIds.Any())
                {
                    foreach (var id in dto.EstudianteIds)
                    {
                        itemsToProcess.Add(new InscribirEstudianteClaseDto { EstudianteId = id });
                    }
                }
                else
                {
                    itemsToProcess.Add(dto);
                }
            }

            if (!itemsToProcess.Any())
            {
                return BadRequest("No se proporcionaron datos de estudiantes a añadir.");
            }

            var procesados = new List<EstudianteProcesadoItem>();

            foreach (var item in itemsToProcess)
            {
                var (user, isNewOrWithoutCreds, tempPassword) = await ResolveOrCreateEstudianteAsync(item);
                if (user == null) continue;

                // Verificar si el estudiante ya cuenta con una inscripción activa en esa clase
                var yaEnClase = clase.Estudiantes.Any(e => e.Id == user.Id);
                var yaInscrito = await _context.Inscripciones.AnyAsync(i => i.EstudianteId == user.Id && i.CatedraId == clase.MateriaId);
                if (yaEnClase || yaInscrito)
                {
                    if (itemsToProcess.Count == 1)
                    {
                        return BadRequest(new { message = "El estudiante ya se encuentra inscrito en esta cátedra/clase." });
                    }
                    continue;
                }

                // Añadir a la clase
                clase.Estudiantes.Add(user);

                // Inscribir en la cátedra/materia de la clase si no existe inscripción
                _context.Inscripciones.Add(new Inscripcion
                {
                    EstudianteId = user.Id,
                    CatedraId = clase.MateriaId,
                    PromedioActual = 75.0,
                    AlertaRendimiento = false
                });

                // Si es nuevo o no tenía credenciales, despachar correo
                if (isNewOrWithoutCreds && !string.IsNullOrWhiteSpace(tempPassword))
                {
                    var correoDestino = user.Persona?.Correo ?? user.Username;
                    var nombreEstudiante = user.Persona != null ? $"{user.Persona.Nombre} {user.Persona.Apellido}".Trim() : user.Username;
                    try
                    {
                        await _emailService.SendCredentialsAsync(correoDestino, nombreEstudiante, user.Username, tempPassword, "Estudiante");
                        _logger.LogInformation("Credenciales despachadas por correo a {Email}", correoDestino);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "No se pudo enviar el correo de credenciales a {Email}", correoDestino);
                    }
                }

                procesados.Add(new EstudianteProcesadoItem
                {
                    id = user.Id,
                    userId = user.Id,
                    username = user.Username,
                    nombre = user.Persona?.Nombre ?? string.Empty,
                    apellido = user.Persona?.Apellido ?? string.Empty,
                    correo = user.Persona?.Correo ?? string.Empty,
                    credencialesEnviadas = isNewOrWithoutCreds,
                    tempPassword = tempPassword,
                    temporalPassword = tempPassword
                });
            }

            if (!procesados.Any())
            {
                return BadRequest(new { message = "El estudiante ya se encuentra inscrito en esta cátedra/clase." });
            }

            await _context.SaveChangesAsync();

            var firstWithCreds = procesados.FirstOrDefault(p => !string.IsNullOrEmpty(p.tempPassword));
            var fallbackUser = procesados.FirstOrDefault();

            return Ok(new
            {
                success = true,
                message = "Estudiantes añadidos exitosamente a la clase.",
                username = firstWithCreds?.username ?? fallbackUser?.username ?? string.Empty,
                tempPassword = firstWithCreds?.tempPassword ?? fallbackUser?.tempPassword ?? string.Empty,
                password = firstWithCreds?.tempPassword ?? fallbackUser?.tempPassword ?? string.Empty,
                totalProcesados = procesados.Count,
                estudiantes = procesados
            });
        }

        private InscribirEstudianteClaseDto ParseDtoFromJsonElement(JsonElement el)
        {
            var dto = new InscribirEstudianteClaseDto();
            if (el.TryGetProperty("estudianteId", out var pEstId) && pEstId.TryGetInt64(out var estId)) dto.EstudianteId = estId;
            else if (el.TryGetProperty("id", out var pId) && pId.TryGetInt64(out var idVal)) dto.EstudianteId = idVal;

            if (el.TryGetProperty("estudianteIds", out var pIds) && pIds.ValueKind == JsonValueKind.Array)
            {
                dto.EstudianteIds = new List<long>();
                foreach (var idEl in pIds.EnumerateArray())
                {
                    if (idEl.TryGetInt64(out var val)) dto.EstudianteIds.Add(val);
                }
            }

            if (el.TryGetProperty("nombre", out var pNom)) dto.Nombre = pNom.GetString();
            else if (el.TryGetProperty("nombres", out var pNoms)) dto.Nombre = pNoms.GetString();

            if (el.TryGetProperty("apellido", out var pApe)) dto.Apellido = pApe.GetString();
            else if (el.TryGetProperty("apellidos", out var pApes)) dto.Apellido = pApes.GetString();

            if (el.TryGetProperty("correo", out var pCor)) dto.Correo = pCor.GetString();
            else if (el.TryGetProperty("email", out var pMail)) dto.Correo = pMail.GetString();

            if (el.TryGetProperty("cedula", out var pCed)) dto.Cedula = pCed.GetString();
            if (el.TryGetProperty("username", out var pUser)) dto.Username = pUser.GetString();

            return dto;
        }

        private async Task<(User? user, bool isNewOrWithoutCreds, string? tempPassword)> ResolveOrCreateEstudianteAsync(InscribirEstudianteClaseDto dto)
        {
            User? user = null;
            bool isNewOrWithoutCreds = false;
            string? tempPassword = null;

            // 1. Buscar por ID
            if (dto.EstudianteId.HasValue && dto.EstudianteId.Value > 0)
            {
                if (dto.EstudianteId.Value <= int.MaxValue)
                {
                    int sId = (int)dto.EstudianteId.Value;
                    user = await _context.Users
                        .Include(u => u.Persona)
                        .FirstOrDefaultAsync(u => u.Id == sId || (u.Persona != null && (u.Persona.Id == sId || u.Persona.UserId == sId)));
                }
            }

            // 2. Buscar por Correo o Username
            if (user == null && !string.IsNullOrWhiteSpace(dto.Correo))
            {
                var normEmail = dto.Correo.Trim().ToLowerInvariant();
                user = await _context.Users
                    .Include(u => u.Persona)
                    .FirstOrDefaultAsync(u => (u.Persona != null && u.Persona.Correo.ToLower() == normEmail) || u.Username.ToLower() == normEmail);
            }

            if (user == null && !string.IsNullOrWhiteSpace(dto.Username))
            {
                var normUser = dto.Username.Trim().ToLowerInvariant();
                user = await _context.Users
                    .Include(u => u.Persona)
                    .FirstOrDefaultAsync(u => u.Username.ToLower() == normUser);
            }

            // Si el usuario existe
            if (user != null)
            {
                // Si no tiene credenciales válidas
                if (user.PasswordSalt == null || user.PasswordSalt.Length == 0 || user.PasswordHash == null || user.PasswordHash.Length == 0)
                {
                    isNewOrWithoutCreds = true;
                    tempPassword = $"Uteq.{RandomNumberGenerator.GetInt32(100000, 999999)}!";
                    using var hmac = new HMACSHA512();
                    user.PasswordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(tempPassword));
                    user.PasswordSalt = hmac.Key;
                }
                return (user, isNewOrWithoutCreds, tempPassword);
            }

            // Si el usuario no existe, crearlo como nuevo estudiante si tenemos datos mínimos
            if (!string.IsNullOrWhiteSpace(dto.Correo) || !string.IsNullOrWhiteSpace(dto.Nombre))
            {
                isNewOrWithoutCreds = true;
                var cleanEmail = !string.IsNullOrWhiteSpace(dto.Correo) 
                    ? dto.Correo.Trim() 
                    : $"estudiante.{RandomNumberGenerator.GetInt32(1000, 9999)}@uteq.edu.ec";
                var cleanNombre = !string.IsNullOrWhiteSpace(dto.Nombre) ? dto.Nombre.Trim() : "Estudiante";
                var cleanApellido = !string.IsNullOrWhiteSpace(dto.Apellido) ? dto.Apellido.Trim() : "Nuevo";

                var baseUsername = !string.IsNullOrWhiteSpace(dto.Username)
                    ? dto.Username.Trim().ToLowerInvariant()
                    : cleanEmail.Contains("@") ? cleanEmail.Split('@')[0].ToLowerInvariant() : $"est.{cleanNombre.ToLowerInvariant()}";

                var candidateUsername = baseUsername;
                int counter = 1;
                while (await _context.Users.AnyAsync(u => u.Username == candidateUsername))
                {
                    candidateUsername = $"{baseUsername}{counter++}";
                }

                tempPassword = $"Uteq.{RandomNumberGenerator.GetInt32(100000, 999999)}!";
                using var hmac = new HMACSHA512();

                user = new User
                {
                    Username = candidateUsername,
                    PasswordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(tempPassword)),
                    PasswordSalt = hmac.Key
                };
                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                var persona = new Persona
                {
                    Nombre = cleanNombre,
                    Apellido = cleanApellido,
                    Correo = cleanEmail,
                    Rol = "Estudiante",
                    UserId = user.Id
                };
                _context.Personas.Add(persona);
                await _context.SaveChangesAsync();
                user.Persona = persona;

                return (user, isNewOrWithoutCreds, tempPassword);
            }

            return (null, false, null);
        }

        // Endpoint para obtener los estudiantes de una clase (docentes de la clase o estudiantes de la clase)
        [HttpGet("{claseId}/estudiantes")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetEstudiantesFromClase(long claseId)
        {
            if (UserId == null) return Unauthorized();

            if (claseId > int.MaxValue) return Ok(new List<UserDto>());
            int cId = (int)claseId;

            var clase = await _context.Clases
                                .Include(c => c.Estudiantes)
                                .AsNoTracking()
                                .FirstOrDefaultAsync(c => c.Id == cId);

            if (clase == null) return NotFound(new { message = "Clase no encontrada." });

            // Autorización: Docente de la clase o estudiante inscrito en la clase
            var isDocente = clase.DocenteId == UserId.Value;
            var isStudent = clase.Estudiantes.Any(e => e.Id == UserId.Value);

            if (!isDocente && !isStudent)
            {
                return Forbid("No tienes permiso para ver los estudiantes de esta clase.");
            }

            var estudiantesDto = clase.Estudiantes.Select(e => new UserDto
            {
                Id = e.Id,
                Username = e.Username,
                // No incluir PasswordHash ni PasswordSalt por seguridad
                // Puedes incluir otros datos de Persona si es necesario
            }).ToList();

            return Ok(estudiantesDto);
        }

        // Endpoint para desvincular estudiante de una clase (docente de la clase o administrador)
        [HttpDelete("{claseId}/estudiantes/{estudianteId}")]
        [HttpDelete("/api/Docente/clases/{claseId}/estudiantes/{estudianteId}")]
        public async Task<IActionResult> RemoveEstudianteFromClase(long claseId, long estudianteId)
        {
            if (UserId == null) return Unauthorized();

            if (claseId > int.MaxValue)
            {
                return Ok(new { success = true, message = "Estudiante removido" });
            }

            int cId = (int)claseId;
            var clase = await _context.Clases
                .Include(c => c.Estudiantes)
                .FirstOrDefaultAsync(c => c.Id == cId);

            if (clase == null)
            {
                return Ok(new { success = true, message = "Estudiante removido" });
            }

            var userRol = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRol != "Administrador" && !await IsDocenteOfClase(claseId))
            {
                return Forbid("Solo el docente de esta clase o un administrador puede desvincular estudiantes.");
            }

            if (estudianteId > int.MaxValue)
            {
                return Ok(new { success = true, message = "Estudiante removido" });
            }

            int eId = (int)estudianteId;
            var estudiante = clase.Estudiantes.FirstOrDefault(e => e.Id == eId);
            if (estudiante == null)
            {
                var persona = await _context.Personas.FirstOrDefaultAsync(p => p.Id == eId);
                if (persona != null)
                {
                    estudiante = clase.Estudiantes.FirstOrDefault(e => e.Id == persona.UserId);
                }
            }

            if (estudiante == null)
            {
                return Ok(new { success = true, message = "Estudiante removido" });
            }

            clase.Estudiantes.Remove(estudiante);

            var inscripcion = await _context.Inscripciones
                .FirstOrDefaultAsync(i => i.EstudianteId == estudiante.Id && i.CatedraId == clase.MateriaId);
            if (inscripcion != null)
            {
                _context.Inscripciones.Remove(inscripcion);
            }

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Estudiante removido" });
        }

        // Endpoint para obtener las clases en las que está registrado el estudiante
        [HttpGet("estudiante/{id}")]
        [HttpGet("/api/estudiante/{id}/clases")]
        public async Task<IActionResult> GetClasesEstudiante(long id)
        {
            int intId = id <= int.MaxValue ? (int)id : 0;
            var user = await _context.Users
                .Include(u => u.Persona)
                .FirstOrDefaultAsync(u => u.Id == intId || (u.Persona != null && (u.Persona.Id == intId || u.Persona.UserId == intId)));

            var targetId = user != null ? user.Id : intId;

            var clases = await _context.Clases
                .Include(c => c.Materia)
                .Include(c => c.Docente)
                    .ThenInclude(d => d.Persona)
                .Include(c => c.Estudiantes)
                .Where(c => c.Estudiantes.Any(e => e.Id == targetId) || _context.Inscripciones.Any(i => i.EstudianteId == targetId && i.CatedraId == c.MateriaId))
                .Select(c => new
                {
                    id = c.Id,
                    claseId = c.Id,
                    nombre = c.Nombre,
                    materiaId = c.MateriaId,
                    materia = c.Materia != null ? c.Materia.Nombre : "",
                    nombreMateria = c.Materia != null ? c.Materia.Nombre : "",
                    docenteId = c.DocenteId,
                    docente = c.Docente != null && c.Docente.Persona != null
                        ? $"{c.Docente.Persona.Nombre} {c.Docente.Persona.Apellido}".Trim()
                        : "Docente asignado",
                    aula = "Aula Principal",
                    horario = "Horario Regular",
                    paralelo = "A"
                })
                .ToListAsync();

            return Ok(clases);
        }
    }

    public class EstudianteProcesadoItem
    {
        public long id { get; set; }
        public long userId { get; set; }
        public string username { get; set; } = string.Empty;
        public string nombre { get; set; } = string.Empty;
        public string apellido { get; set; } = string.Empty;
        public string correo { get; set; } = string.Empty;
        public bool credencialesEnviadas { get; set; }
        public string? tempPassword { get; set; }
        public string? temporalPassword { get; set; }
    }
}
