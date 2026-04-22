namespace LogMyPos_Backend.Model.Dto.Profile;

public sealed class CreateProfileRequest {
	public required Guid UserId { get; set; }
	public required string DisplayName { get; set; }
}
