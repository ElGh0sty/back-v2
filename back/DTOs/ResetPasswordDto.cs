namespace back.DTOs
{
    public class ResetPasswordDto
    {
        public string EmailOrUsername { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}
