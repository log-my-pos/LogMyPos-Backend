using LogMyPos_Backend.Model;
using Microsoft.AspNetCore.Mvc;

namespace LogMyPos_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ProfileController : ControllerBase {
	[HttpGet("{id:guid}")]
	public ActionResult<Profile> GetProfile(Guid id) {
		return Ok(new Profile {
			Id = id,
			UserId = Guid.NewGuid(),
			DisplayName = "Placeholder",
			ProfileImageUrl = "Placeholder"
		});
	}

	[HttpPost]
	public ActionResult<Profile> PostProfile([FromBody] Profile profile) {
		return CreatedAtAction(nameof(GetProfile), new { id = profile.Id }, profile);
	}
}