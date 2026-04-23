namespace LogMyPos_Backend.Model.Dto.User;

public sealed class LoginUserRequest {
	public required string Email { get; set; }
	public required string Password { get; set; }
}