using LogMyPos_Backend.DbContext;
using LogMyPos_Backend.Model;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text;

var webAppOptions = new WebApplicationOptions {
	Args = args,
	WebRootPath = "wwwroot"
};

var builder = WebApplication.CreateBuilder(webAppOptions);

builder.Services.AddControllers();

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen(options => {
	options.AddSecurityDefinition(JwtBearerDefaults.AuthenticationScheme, new OpenApiSecurityScheme {
		Type = SecuritySchemeType.Http,
		Scheme = "bearer",
		BearerFormat = "JWT",
		Description = "JWT Authorization header using the Bearer scheme."
	});

	options.AddSecurityRequirement(document => new OpenApiSecurityRequirement {
		[new OpenApiSecuritySchemeReference("bearer", document)] = []
	});
});

builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

builder.Services.AddAuthentication(options => {
		options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
		options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
	}).AddJwtBearer(options => {
		var jwtIssuer = builder.Configuration["Jwt:Issuer"] ??
		                throw new InvalidOperationException("JWT issuer is not configured.");
		var jwtAudience = builder.Configuration["Jwt:Audience"] ??
		                  throw new InvalidOperationException("JWT audience is not configured.");
		var jwtKey = builder.Configuration["Jwt:Key"] ??
		             throw new InvalidOperationException("JWT key is not configured.");

		options.TokenValidationParameters = new TokenValidationParameters {
			ValidateIssuer = true,
			ValidateAudience = true,
			ValidateLifetime = true,
			ValidateIssuerSigningKey = true,
			ValidIssuer = jwtIssuer,
			ValidAudience = jwtAudience,
			IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
			ClockSkew = TimeSpan.Zero
		};
	});
builder.Services.AddAuthorization();

//builder.Services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase("LogMyPos"));
builder.Services.AddDbContext<AppDbContext>(dbOptions =>
	dbOptions.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment()) {
	using var scope = app.Services.CreateScope();
	var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
	db.Database.Migrate();
}

app.MapOpenApi();
app.UseSwagger();
app.UseSwaggerUI(options => { options.EnablePersistAuthorization(); });

app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

static OpenApiSecuritySchemeReference CreateSecuritySchemeReference() {
	OpenApiDocument? hostDocument = null;
	string? externalResource = null;
	return new OpenApiSecuritySchemeReference(JwtBearerDefaults.AuthenticationScheme, hostDocument, externalResource);
}
