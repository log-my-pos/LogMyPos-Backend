package dev.pandasystems.logmyposbackend.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.util.UUID

@Entity
@Table(name = "users")
class User(
	@Id @GeneratedValue
	var id: UUID? = null,
	@Column(unique = true)
	var username: String,
	@Column(unique = true)
	var email: String,
	var hashedPassword: String,
	@Enumerated(EnumType.STRING)
	var role: Role = Role.USER,
) {
	enum class Role {
		USER, ADMIN
	}
}
