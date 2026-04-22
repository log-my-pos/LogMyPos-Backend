namespace LogMyPos_Backend.Model.Dto.User;

public sealed class CreateUserRequest {
	public required string Username { get; set; }
	public required string Email { get; set; }
	public required string HashedPassword { get; set; }
}
