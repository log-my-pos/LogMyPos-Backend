using System.Text.Json.Serialization;

namespace LogMyPos_Backend.Model.Dto.User;

public sealed class UserResponse {
	public required Guid Id { get; init; }
	public required string Username { get; init; }
	public required string Email { get; init; }
	[JsonConverter(typeof(JsonStringEnumConverter))]
	public required Model.User.UserRole Role { get; init; }
	public required DateTime CreatedAt { get; init; }
	public required DateTime UpdatedAt { get; init; }
}

