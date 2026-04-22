using LogMyPos_Backend.DbContext;
using LogMyPos_Backend.Model;
using LogMyPos_Backend.Model.Dto.User;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CreateUserRequest = LogMyPos_Backend.Model.Dto.User.CreateUserRequest;

namespace LogMyPos_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class UserController(AppDbContext dbContext) : ControllerBase {
	[HttpGet("{id:guid}")]
	public async Task<ActionResult<User>> GetUser(Guid id) {
		var fetchedUser = await dbContext.Users.FirstOrDefaultAsync(user => user.Id == id);

		if (fetchedUser is null) {
			return NotFound();
		}

		return Ok(fetchedUser);
	}

	[HttpPost]
	public async Task<ActionResult<User>> CreateUser([FromBody] CreateUserRequest request) {
		var user = new User {
			Username = request.Username,
			Email = request.Email,
			HashedPassword = request.HashedPassword
		};

		dbContext.Users.Add(user);
		await dbContext.SaveChangesAsync();
		return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
	}
	
	[HttpDelete]
	public async Task<ActionResult> DeleteUser(Guid id) {
		var user = await dbContext.Users.FirstOrDefaultAsync(user => user.Id == id);

		if (user is null) {
			return NotFound();
		}

		dbContext.Users.Remove(user);
		await dbContext.SaveChangesAsync();
		return NoContent();
	}
}