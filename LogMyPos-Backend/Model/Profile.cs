namespace LogMyPos_Backend.Model;

public sealed class Profile {
	public required Guid Id { get; init; }
	public required Guid UserId { get; set; }
	public required string DisplayName { get; set; }
	public required string ProfileImageUrl { get; set; }
	public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
	public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
