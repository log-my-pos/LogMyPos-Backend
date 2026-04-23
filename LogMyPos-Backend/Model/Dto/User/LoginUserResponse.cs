namespace LogMyPos_Backend.Model.Dto.User;


public sealed class LoginUserResponse {
	public required Guid Id { get; init; }
	public required string Username { get; init; }
	public required string Email { get; init; }
	public required string Token { get; init; }
}