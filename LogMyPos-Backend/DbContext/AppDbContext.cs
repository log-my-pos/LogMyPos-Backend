using LogMyPos_Backend.Model;
using Microsoft.EntityFrameworkCore;

namespace LogMyPos_Backend.DbContext;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : Microsoft.EntityFrameworkCore.DbContext(options) {
	public DbSet<User> Users => Set<User>();
	public DbSet<Profile> Profiles => Set<Profile>();

	protected override void OnModelCreating(ModelBuilder modelBuilder) {
		base.OnModelCreating(modelBuilder);

		modelBuilder.Entity<User>()
			.Property(user => user.Role)
			.HasConversion<string>()
			.HasColumnType("text");
	}
}

