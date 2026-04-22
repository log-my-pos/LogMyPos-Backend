using LogMyPos_Backend.DbContext;
using Microsoft.EntityFrameworkCore;

var options = new WebApplicationOptions {
	Args = args,
	WebRootPath = "wwwroot"
};

var builder = WebApplication.CreateBuilder(options);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddControllers();
builder.Services.AddSwaggerGen();
builder.Services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase("LogMyPos"));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment()) {
	
}

app.MapOpenApi();
app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();
app.UseStaticFiles();
app.MapControllers();

app.Run();