using LogMyPos_Backend.Model;
using Microsoft.AspNetCore.Mvc;

namespace LogMyPos_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class UserController : ControllerBase {
	[HttpGet("{id:guid}")]
	public ActionResult<User> GetUser(Guid id) {
		return Ok(new User {
			Id = id,
			Username = "Placeholder",
			Email = "Placeholder",
			HashedPassword = "Placeholder"
		});
	}

	[HttpPost]
	public ActionResult<User> PostUser([FromBody] User user) {
		return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
	}
}