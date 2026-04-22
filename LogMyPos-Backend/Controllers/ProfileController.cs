using LogMyPos_Backend.DbContext;
using LogMyPos_Backend.Model;
using LogMyPos_Backend.Model.Dto.Profile;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LogMyPos_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ProfileController(AppDbContext dbContext, IWebHostEnvironment environment) : ControllerBase {
	private const long MaxProfileImageSizeInBytes = 5 * 1024 * 1024;
	private static readonly HashSet<string> AllowedImageContentTypes = ["image/jpeg", "image/png", "image/webp"];

	[HttpGet("{id:guid}")]
	public async Task<ActionResult<Profile>> GetProfile(Guid id) {
		var fetchedProfile = await dbContext.Profiles.FirstOrDefaultAsync(profile => profile.Id == id);

		if (fetchedProfile is null) {
			return NotFound();
		}

		return Ok(fetchedProfile);
	}
	
	[HttpGet("user/{userId:guid}")]
	public async Task<ActionResult<Profile>> GetProfileFromUserId(Guid userId) {
		var fetchedProfile = await dbContext.Profiles.FirstOrDefaultAsync(profile => profile.UserId == userId);

		if (fetchedProfile is null) {
			return NotFound();
		}

		return Ok(fetchedProfile);
	}

	[HttpPost]
	[Consumes("multipart/form-data")]
	public async Task<ActionResult<Profile>> CreateProfile([FromForm] CreateProfileRequest request) {
		if (await dbContext.Profiles.FirstOrDefaultAsync(profile => profile.UserId == request.UserId) is not null) {
			return BadRequest("Profile for this user already exists.");
		}

		if (request.ProfileImage is not null) {
			if (!AllowedImageContentTypes.Contains(request.ProfileImage.ContentType)) {
				return BadRequest("Only JPEG, PNG, and WEBP images are allowed.");
			}

			if (request.ProfileImage.Length > MaxProfileImageSizeInBytes) {
				return BadRequest("Profile image size cannot exceed 5 MB.");
			}
		}
		
		var profile = new Profile {
			UserId = request.UserId,
			DisplayName = request.DisplayName,
		};

		if (request.ProfileImage is not null && request.ProfileImage.Length > 0) {
			var uploadsDirectory = Path.Combine(environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot"), "profile-images");
			Directory.CreateDirectory(uploadsDirectory);

			var fileName = $"{Guid.NewGuid()}{Path.GetExtension(request.ProfileImage.FileName)}";
			var filePath = Path.Combine(uploadsDirectory, fileName);

			await using var stream = System.IO.File.Create(filePath);
			await request.ProfileImage.CopyToAsync(stream);

			profile.ProfileImageUrl = $"/profile-images/{fileName}";
		}

		dbContext.Profiles.Add(profile);
		await dbContext.SaveChangesAsync();
		return CreatedAtAction(nameof(GetProfile), new { id = profile.Id }, profile);
	}

	[HttpDelete]
	public async Task<ActionResult> DeleteProfile(Guid id) {
		var profile = await dbContext.Profiles.FirstOrDefaultAsync(profile => profile.Id == id);

		if (profile is null) {
			return NotFound();
		}

		dbContext.Profiles.Remove(profile);
		await dbContext.SaveChangesAsync();
		return NoContent();
	}
}