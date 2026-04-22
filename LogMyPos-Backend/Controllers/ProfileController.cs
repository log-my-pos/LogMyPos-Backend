using LogMyPos_Backend.DbContext;
using LogMyPos_Backend.Model;
using LogMyPos_Backend.Model.Dto.Profile;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LogMyPos_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ProfileController(AppDbContext dbContext) : ControllerBase {
	[HttpGet("{id:guid}")]
	public async Task<ActionResult<Profile>> GetProfile(Guid id) {
		var fetchedProfile = await dbContext.Profiles.FirstOrDefaultAsync(profile => profile.Id == id);

		if (fetchedProfile is null) {
			return NotFound();
		}

		return Ok(fetchedProfile);
	}

	[HttpPost]
	public async Task<ActionResult<Profile>> PostProfile([FromBody] CreateProfileRequest request) {
		var profile = new Profile {
			UserId = request.UserId,
			DisplayName = request.DisplayName,
		};

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