namespace LogMyPos_Backend.Model;

public sealed class Profile {
	public Guid Id { get; init; } = Guid.NewGuid();
	public required Guid UserId { get; set; }
	public required string DisplayName { get; set; }
	public string? ProfileImageUrl { get; set; }
	public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
	public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
