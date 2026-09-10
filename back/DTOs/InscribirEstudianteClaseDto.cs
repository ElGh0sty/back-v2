using System.Collections.Generic;

namespace back.DTOs
{
    public class InscribirEstudianteClaseDto
    {
        public int? EstudianteId { get; set; }
        public int? Id { get; set; }
        public List<int>? EstudianteIds { get; set; }
        public string? Nombre { get; set; }
        public string? Nombres { get; set; }
        public string? Apellido { get; set; }
        public string? Apellidos { get; set; }
        public string? Correo { get; set; }
        public string? Email { get; set; }
        public string? Cedula { get; set; }
        public string? Username { get; set; }
    }
}
