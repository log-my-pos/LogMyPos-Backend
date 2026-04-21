using LogMyPos_Backend.Model;
using Microsoft.AspNetCore.Mvc;

namespace LogMyPos_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class UserController : ControllerBase {
	[HttpGet("{id:int}")]
	public ActionResult<User> GetUser(int id) {
		return Ok(new User(id, "placeholder"));
	}

	[HttpPost]
	public ActionResult<User> PostUser([FromBody] User user) {
		return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
	}
}