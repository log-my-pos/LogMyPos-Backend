using LogMyPos_Backend.DbContext;
using LogMyPos_Backend.Model;
using LogMyPos_Backend.Model.Dto.User;
using Microsoft.AspNetCore.Authorization;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using CreateUserRequest = LogMyPos_Backend.Model.Dto.User.CreateUserRequest;

namespace LogMyPos_Backend.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class UserController(AppDbContext dbContext, IPasswordHasher<User> passwordHasher, IConfiguration configuration) : ControllerBase {
	[HttpGet]
	public async Task<ActionResult<IEnumerable<UserResponse>>> GetUsers() {
		var users = await dbContext.Users.ToListAsync();
		return Ok(users.Select(ToUserResponse));
	}
	
	[HttpGet("{id:guid}")]
	public async Task<ActionResult<UserResponse>> GetUser(Guid id) {
		var fetchedUser = await dbContext.Users.FirstOrDefaultAsync(user => user.Id == id);

		if (fetchedUser is null) {
			return NotFound();
		}

		return Ok(ToUserResponse(fetchedUser));
	}

	[HttpPost]
	[AllowAnonymous]
	public async Task<ActionResult<UserResponse>> CreateUser([FromBody] CreateUserRequest request) {
		var user = new User {
			Username = request.Username,
			Email = request.Email,
			HashedPassword = string.Empty
		};

		user.HashedPassword = passwordHasher.HashPassword(user, request.Password);

		dbContext.Users.Add(user);
		await dbContext.SaveChangesAsync();
		return CreatedAtAction(nameof(GetUser), new { id = user.Id }, ToUserResponse(user));
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

	[HttpPost("login")]
	[AllowAnonymous]
	public async Task<ActionResult<LoginUserResponse>> LoginUser([FromBody] LoginUserRequest request) {
		var user = await dbContext.Users.FirstOrDefaultAsync(user => user.Email == request.Email);

		if (user is null) {
			return Unauthorized();
		}

		var verificationResult = passwordHasher.VerifyHashedPassword(user, user.HashedPassword, request.Password);
		switch (verificationResult) {
			case PasswordVerificationResult.Failed:
				return Unauthorized();
			case PasswordVerificationResult.SuccessRehashNeeded:
				user.HashedPassword = passwordHasher.HashPassword(user, request.Password);
				await dbContext.SaveChangesAsync();
				break;
		}

		var response = new LoginUserResponse {
			Id = user.Id,
			Username = user.Username,
			Email = user.Email,
			Token = GenerateJwtToken(user)
		};

		return Ok(response);
	}

	private static UserResponse ToUserResponse(User user) {
		return new UserResponse {
			Id = user.Id,
			Username = user.Username,
			Email = user.Email,
			CreatedAt = user.CreatedAt,
			UpdatedAt = user.UpdatedAt
		};
	}

	private string GenerateJwtToken(User user) {
		var jwtIssuer = configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("JWT issuer is not configured.");
		var jwtAudience = configuration["Jwt:Audience"] ?? throw new InvalidOperationException("JWT audience is not configured.");
		var jwtKey = configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT key is not configured.");
		var tokenExpiryMinutes = int.TryParse(configuration["Jwt:ExpiryMinutes"], out var expiryMinutes)
			? expiryMinutes
			: 60;

		var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
		var signingCredentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
		var claims = new List<Claim> {
			new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
			new(JwtRegisteredClaimNames.UniqueName, user.Username),
			new(JwtRegisteredClaimNames.Email, user.Email),
			new(ClaimTypes.NameIdentifier, user.Id.ToString()),
			new(ClaimTypes.Name, user.Username),
			new(ClaimTypes.Email, user.Email)
		};

		var token = new JwtSecurityToken(
			issuer: jwtIssuer,
			audience: jwtAudience,
			claims: claims,
			expires: DateTime.UtcNow.AddMinutes(tokenExpiryMinutes),
			signingCredentials: signingCredentials
		);

		return new JwtSecurityTokenHandler().WriteToken(token);
	}
}