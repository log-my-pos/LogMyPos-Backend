using System.ComponentModel.DataAnnotations;

namespace LogMyPos_Backend.Model;

public class User {
	public Guid Id { get; init; } = Guid.NewGuid();
	public required string Username { get; set; }
	[EmailAddress] public required string Email { get; set; }
	public required string HashedPassword { get; set; }
	public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
	public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
